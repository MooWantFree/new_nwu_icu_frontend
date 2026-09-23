<template>
  <main class="min-h-screen bg-gray-50 px-4 py-10 text-gray-900">
    <div class="mx-auto max-w-6xl">
      <div v-if="loading" class="surface-card p-10 text-center text-gray-500">
        正在验证管理权限…
      </div>

      <div v-else-if="notFound" class="py-24 text-center">
        <p class="text-7xl font-semibold text-gray-300">404</p>
        <p class="mt-4 text-gray-500">页面不存在</p>
      </div>

      <section v-else-if="session && !session.passkey_enrolled" class="surface-card mx-auto max-w-lg p-6">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">首次绑定</p>
        <h1 class="mt-2 text-2xl font-semibold">绑定管理员 Passkey</h1>
        <p class="mt-3 text-sm leading-6 text-gray-600">
          请先通过 SSH 执行 <code>python manage.py admin_passkey_enroll &lt;username&gt;</code>，再输入五分钟内有效的一次性许可码。
        </p>
        <label class="mt-6 block text-sm font-medium text-gray-700">设备名称</label>
        <input v-model.trim="deviceName" maxlength="100" autocomplete="off" class="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" placeholder="例如：Windows Hello" />
        <label class="mt-4 block text-sm font-medium text-gray-700">一次性许可码</label>
        <input v-model.trim="enrollmentCode" maxlength="128" autocomplete="one-time-code" class="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
        <button :disabled="passkeyBusy || !deviceName || !enrollmentCode" class="btn-primary mt-6 w-full py-2.5" @click="registerPasskey">
          {{ passkeyBusy ? '正在绑定…' : '绑定 Passkey' }}
        </button>
        <p v-if="authError" class="mt-3 text-sm text-red-700">{{ authError }}</p>
      </section>

      <section v-else-if="session && !session.elevated" class="surface-card mx-auto max-w-lg p-6">
        <p class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">管理员验证</p>
        <h1 class="mt-2 text-2xl font-semibold">使用 Passkey 继续</h1>
        <p class="mt-3 text-sm leading-6 text-gray-600">验证成功后将获得十分钟管理权限，每次管理操作会刷新有效期。系统不会向普通用户提供此功能。</p>
        <button :disabled="passkeyBusy || !webAuthnSupported" class="btn-primary mt-6 w-full py-2.5" @click="authenticatePasskey">
          {{ passkeyBusy ? '正在验证…' : webAuthnSupported ? '验证 Passkey' : '当前浏览器不支持 Passkey' }}
        </button>
        <p v-if="session.passkey_count < 2" class="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">当前只有一个有效凭据；验证后可通过管理员面板再绑定一个备用设备。</p>
        <p v-if="authError" class="mt-3 text-sm text-red-700">{{ authError }}</p>
      </section>

      <template v-else-if="session?.elevated">
        <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">NWU.ICU</p>
            <h1 class="mt-2 text-3xl font-semibold">管理员面板</h1>
            <p class="mt-2 text-sm text-gray-600">Passkey 有效期为十分钟，每次管理操作后重新计时，连续十分钟无操作将自动失效。</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button class="btn-secondary" @click="showEnrollmentForm = !showEnrollmentForm">
              {{ showEnrollmentForm ? '取消添加 Passkey' : '添加备用 Passkey' }}
            </button>
            <a v-if="safeNext" :href="safeNext" class="btn-secondary">继续前往 Django Admin</a>
          </div>
        </header>

        <section v-if="showEnrollmentForm" class="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 class="font-semibold">添加管理员 Passkey</h2>
          <p class="mt-2 text-sm text-gray-600">先通过 SSH 签发新的五分钟许可码，再在此设备完成注册。</p>
          <div class="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label class="text-sm font-medium text-gray-700">设备名称<input v-model.trim="deviceName" maxlength="100" autocomplete="off" class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
            <label class="text-sm font-medium text-gray-700">一次性许可码<input v-model.trim="enrollmentCode" maxlength="128" autocomplete="one-time-code" class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 font-mono shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
            <button :disabled="passkeyBusy || !deviceName || !enrollmentCode" class="btn-primary" @click="registerPasskey">
              {{ passkeyBusy ? '正在绑定…' : '绑定 Passkey' }}
            </button>
          </div>
          <p v-if="authError" class="mt-3 text-sm text-red-700">{{ authError }}</p>
        </section>

        <nav class="mb-6 flex flex-wrap gap-2" aria-label="管理功能">
          <button v-if="session.permissions.moderate_reports" :class="tabClass('reports')" @click="selectTab('reports')">举报处理</button>
          <button v-if="session.permissions.publish_announcements" :class="tabClass('announcements')" @click="selectTab('announcements')">公告管理</button>
          <button v-if="session.permissions.review_resource_uploads" :class="tabClass('uploads')" @click="selectTab('uploads')">文件审核</button>
          <button v-if="session.permissions.manage_resource_files" :class="tabClass('files')" @click="selectTab('files')">资料管理</button>
          <button v-if="session.permissions.manage_telegram_notifications" :class="tabClass('notifications')" @click="selectTab('notifications')">Telegram 通知</button>
          <button v-if="session.permissions.publish_announcements" :class="tabClass('about')" @click="selectTab('about')">关于本站</button>
        </nav>

        <ResourceFileManager v-if="tab === 'files' && session.permissions.manage_resource_files" @session-expired="loadSession" />
        <section v-else-if="!availableTabs.length" class="surface-card p-8 text-center text-gray-500">当前账号没有管理功能权限。</section>

        <section v-else-if="tab === 'about'" class="surface-card p-5">
          <h2 class="font-semibold">编辑关于本站</h2>
          <p class="mt-1 text-sm text-gray-500">正文使用与公告相同的格式，可插入链接和图片。</p>
          <div v-if="aboutLoading" class="py-12 text-center text-gray-500">加载中…</div>
          <template v-else>
            <div v-if="aboutError" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              {{ aboutError }}
              <button type="button" class="ml-2 font-medium underline" @click="loadAbout">重试</button>
            </div>
            <label class="mt-5 block text-sm font-medium text-gray-700">正文</label>
            <div class="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-900"><GuestbookEditor v-model="aboutContent" :disabled="aboutBusy || Boolean(aboutError)" allow-images placeholder="输入关于本站的内容…" /></div>
            <div class="mt-5 flex flex-wrap items-center justify-end gap-3">
              <span v-if="aboutMessage" class="mr-auto text-sm" :class="aboutSucceeded ? 'text-emerald-700' : 'text-red-700'">{{ aboutMessage }}</span>
              <button :disabled="aboutBusy || Boolean(aboutError)" class="btn-primary px-5" @click="saveAbout">{{ aboutBusy ? '正在保存…' : '保存内容' }}</button>
            </div>
          </template>
        </section>

        <section v-else-if="tab === 'reports'" class="space-y-4">
          <div class="flex flex-wrap gap-3">
            <select v-model="reportStatus" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm" @change="loadReports(1)">
              <option value="pending">待处理</option><option value="dismissed">已驳回</option><option value="removed">已移除</option>
            </select>
            <select v-model="reportBoard" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm" @change="loadReports(1)">
              <option value="">全部来源</option><option value="guestbook">留言板</option><option value="announcement">公告回复</option>
            </select>
          </div>
          <div v-if="sectionLoading" class="py-16 text-center text-gray-500">加载中…</div>
          <article v-for="report in reports" v-else :key="report.id" class="surface-card p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div><span class="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700">{{ reasonLabel(report.reason) }}</span><span class="ml-2 text-sm text-gray-600">#{{ report.id }} · {{ report.entry.board === 'guestbook' ? '留言板' : '公告回复' }}</span></div>
              <time class="text-xs text-gray-500">{{ formatDate(report.created_at) }}</time>
            </div>
            <p class="mt-4 whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-800">{{ report.entry.content }}</p>
            <p v-if="report.entry.parent_content" class="mt-2 text-xs text-gray-500">回复上下文：{{ report.entry.parent_content }}</p>
            <dl class="mt-4 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
              <div>作者：{{ report.entry.author.nickname }}（{{ report.entry.author.username }}）</div>
              <div>举报人：{{ report.reporter.nickname }}（{{ report.reporter.username }}）</div>
              <div v-if="report.detail" class="sm:col-span-2">说明：{{ report.detail }}</div>
            </dl>
            <div v-if="report.status === 'pending'" class="mt-4 flex flex-col gap-3 sm:flex-row">
              <input v-model.trim="reportNotes[report.id]" maxlength="500" class="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" placeholder="处理说明（必填）" />
              <button class="btn-secondary" @click="resolveReport(report.id, 'dismiss')">驳回举报</button>
              <button class="btn-danger" @click="resolveReport(report.id, 'remove')">移除内容</button>
            </div>
            <p v-else class="mt-4 text-sm text-gray-600">处理说明：{{ report.handling_note }}</p>
          </article>
          <p v-if="!sectionLoading && !reports.length" class="py-16 text-center text-gray-500">没有符合条件的举报。</p>
          <Pager :page="reportPage" :max-page="reportMaxPage" @change="loadReports" />
        </section>

        <section v-else-if="tab === 'announcements'" class="space-y-4">
          <div class="surface-card p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 class="font-semibold">{{ editingAnnouncementId === null ? '发布公告' : '编辑公告' }}</h2>
                <p class="mt-1 text-sm text-gray-500">优先级越高越靠前；相同优先级按更新时间倒序。</p>
              </div>
              <button v-if="editingAnnouncementId !== null" type="button" :disabled="announcementBusy" class="btn-secondary" @click="resetAnnouncementEditor">取消编辑</button>
            </div>
            <div class="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
              <label class="block text-sm font-medium text-gray-700">标题
                <input v-model.trim="announcementTitle" :disabled="announcementBusy" maxlength="100" class="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100" />
              </label>
              <label class="block text-sm font-medium text-gray-700">优先级
                <input v-model.number="announcementPriority" :disabled="announcementBusy" type="number" min="-100" max="100" step="1" class="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-100" />
              </label>
            </div>
            <label class="mt-5 block text-sm font-medium text-gray-700">正文</label>
            <div class="mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white text-gray-900"><GuestbookEditor v-model="announcementContent" :disabled="announcementBusy" allow-images placeholder="输入公告内容…" /></div>
            <div class="mt-5 flex flex-wrap items-center justify-end gap-3">
              <span v-if="announcementMessage" class="mr-auto text-sm" :class="announcementSucceeded ? 'text-emerald-700' : 'text-red-700'">{{ announcementMessage }}</span>
              <button :disabled="announcementBusy" class="btn-primary px-5" @click="saveAnnouncement">
                {{ announcementBusy ? '正在保存…' : editingAnnouncementId === null ? '发布公告' : '保存修改' }}
              </button>
            </div>
          </div>

          <div class="surface-card p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <h2 class="font-semibold">公告列表</h2>
              <select v-model="announcementVisibility" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm" @change="loadAnnouncements(1)">
                <option value="published">已发布</option>
                <option value="hidden">已隐藏</option>
              </select>
            </div>
            <div v-if="sectionLoading" class="py-12 text-center text-gray-500">加载中…</div>
            <div v-else-if="announcements.length" class="mt-4 divide-y divide-gray-200 rounded-xl border border-gray-200">
              <article v-for="announcement in announcements" :key="announcement.id" class="p-4">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h3 class="truncate font-medium text-gray-900">{{ announcement.title || '公告' }}</h3>
                    <p class="mt-1 text-xs text-gray-500">优先级 {{ announcement.priority }} · 更新于 {{ formatDate(announcement.updated_at) }}</p>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" class="btn-secondary min-h-9 px-3 py-1" :disabled="announcementBusy || announcementActionId !== null" @click="editAnnouncement(announcement)">编辑</button>
                    <button type="button" class="btn-secondary min-h-9 px-3 py-1" :disabled="announcementBusy || announcementActionId !== null" @click="toggleAnnouncementVisibility(announcement)">{{ announcement.is_visible ? '隐藏' : '发布' }}</button>
                    <button v-if="!announcement.is_visible" type="button" class="btn-danger min-h-9 px-3 py-1" :disabled="announcementBusy || announcementActionId !== null" @click="deleteAnnouncement(announcement)">删除</button>
                  </div>
                </div>
              </article>
            </div>
            <p v-else class="py-12 text-center text-gray-500">没有{{ announcementVisibility === 'published' ? '已发布' : '已隐藏' }}的公告。</p>
            <Pager :page="announcementPage" :max-page="announcementMaxPage" @change="loadAnnouncements" />
          </div>
        </section>

        <section v-else-if="tab === 'notifications'" class="surface-card p-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 class="font-semibold">Telegram 通知</h2>
              <p class="mt-2 text-sm text-gray-600">分别控制网站事件是否发送到已配置的 Telegram 管理群组。关闭开关不会影响站内通知。</p>
            </div>
            <span v-if="telegramMessage" class="text-sm" :class="telegramSucceeded ? 'text-emerald-700' : 'text-red-700'">{{ telegramMessage }}</span>
          </div>
          <div v-if="sectionLoading" class="py-12 text-center text-gray-500">加载中…</div>
          <div v-else class="mt-5 divide-y divide-gray-200 rounded-xl border border-gray-200">
            <label v-for="item in telegramSwitches" :key="item.key" class="flex cursor-pointer items-center justify-between gap-4 p-4">
              <span><span class="block text-sm font-medium text-gray-900">{{ item.label }}</span><span class="mt-1 block text-xs text-gray-500">{{ item.description }}</span></span>
              <input v-model="telegramSettings[item.key]" type="checkbox" class="h-5 w-5 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            </label>
          </div>
          <div class="mt-5 flex justify-end">
            <button :disabled="telegramBusy || sectionLoading" class="btn-primary px-5" @click="saveTelegramSettings">{{ telegramBusy ? '正在保存…' : '保存设置' }}</button>
          </div>
        </section>

        <section v-else-if="tab === 'uploads'" class="space-y-4">
          <div class="surface-card p-5">
            <button type="button" class="flex w-full items-center justify-between gap-3 text-left font-semibold" :aria-expanded="showUploadBlacklist" aria-controls="upload-blacklist" @click="showUploadBlacklist = !showUploadBlacklist">
              <span>投稿文件夹黑名单</span><span class="text-sm text-blue-700">{{ showUploadBlacklist ? '收起' : '设置' }}</span>
            </button>
            <p class="mt-2 text-sm text-gray-600">此黑名单仅控制投稿，不影响公开浏览或下载。要隐藏资料，请在“资料管理”中进入目标目录，再设置“访问权限”。</p>
            <ResourceUploadBlacklist v-if="showUploadBlacklist" id="upload-blacklist" class="mt-5" @session-expired="loadSession" />
          </div>
          <select v-model="uploadStatus" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 shadow-sm" @change="loadUploads(1)">
            <option value="pending">待审核</option><option value="publish_failed">发布失败</option><option value="publishing">发布中</option><option value="rejected">已拒绝</option><option value="approved">已通过</option><option value="">全部</option>
          </select>
          <div v-if="sectionLoading" class="py-16 text-center text-gray-500">加载中…</div>
          <article v-for="upload in uploads" v-else :key="upload.id" class="surface-card p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div><h2 class="font-semibold">投稿 #{{ upload.id }}</h2><p class="mt-1 text-sm text-gray-600">{{ upload.uploaded_by.nickname }}（{{ upload.uploaded_by.username }}）· {{ upload.total_size_display }}</p></div>
              <span class="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">{{ uploadStatusLabel(upload.status) }}</span>
            </div>
            <div class="mt-4 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
              <template v-for="file in upload.files" :key="file.id">
                <span v-if="upload.status === 'approved'" class="block">{{ file.relative_path }} · {{ file.size_display }}</span>
                <a v-else :href="`/api/management/uploads/files/${file.id}/download/`" class="text-link block">{{ file.relative_path }} · {{ file.size_display }}</a>
              </template>
            </div>
            <div v-if="upload.status === 'approved' && toSafeExternalUrl(upload.resource_url)" class="mt-4">
              <p class="text-xs font-medium text-gray-500">主站目录</p>
              <a
                :href="toSafeExternalUrl(upload.resource_url) ?? undefined"
                target="_blank"
                rel="noopener noreferrer"
                class="text-link mt-1 block break-all text-sm"
              >{{ displayResourceUrl(upload.resource_url) }}</a>
            </div>
            <div v-if="upload.status === 'pending' || upload.status === 'publish_failed'" class="mt-4 grid gap-3">
              <label class="text-sm font-medium text-gray-700">最终目录<input v-model.trim="uploadPaths[upload.id]" maxlength="2048" class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
              <label class="text-sm font-medium text-gray-700">拒绝理由<input v-model.trim="uploadReasons[upload.id]" maxlength="2000" class="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" /></label>
              <div class="flex justify-end gap-3">
                <button class="inline-flex min-h-10 items-center justify-center rounded-[10px] border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50" @click="reviewUpload(upload, 'reject')">拒绝</button>
                <button class="btn-primary" @click="reviewUpload(upload, upload.status === 'publish_failed' ? 'retry' : 'approve')">{{ upload.status === 'publish_failed' ? '重新发布' : '通过并发布' }}</button>
              </div>
            </div>
            <p v-if="upload.publish_error" class="mt-3 text-sm text-red-700">发布错误：{{ upload.publish_error }}</p>
          </article>
          <p v-if="!sectionLoading && !uploads.length" class="py-16 text-center text-gray-500">没有符合条件的投稿。</p>
          <Pager :page="uploadPage" :max-page="uploadMaxPage" @change="loadUploads" />
        </section>

        <p v-if="sectionError" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{{ sectionError }}</p>
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { browserSupportsWebAuthn, startAuthentication, startRegistration } from '@simplewebauthn/browser'
import { useMessage } from 'naive-ui'
import GuestbookEditor from '@/components/guestbook/GuestbookEditor.vue'
import ResourceUploadBlacklist from '@/components/upload/ResourceUploadBlacklist.vue'
import ResourceFileManager from '@/components/manage/ResourceFileManager.vue'
import { api } from '@/lib/requests'
import { toSafeExternalUrl } from '@/lib/security'
import type { GuestbookEntry } from '@/types/api/guestbook'
import type { ManagementReport, ManagementSession, TelegramNotificationSettings } from '@/types/api/management'
import type { ResourceUploadRequest } from '@/types/api/resourceUpload'

type Tab = 'about' | 'reports' | 'announcements' | 'uploads' | 'files' | 'notifications'

const Pager = defineComponent({
  props: { page: { type: Number, required: true }, maxPage: { type: Number, required: true } },
  emits: ['change'],
  setup(props, { emit }) {
    return () => props.maxPage > 1 ? h('div', { class: 'flex justify-center gap-3 pt-2' }, [
      h('button', { disabled: props.page <= 1, class: 'btn-secondary min-h-9 px-3 py-1 disabled:opacity-40', onClick: () => emit('change', props.page - 1) }, '上一页'),
      h('span', { class: 'px-2 py-1 text-sm text-gray-500' }, `${props.page} / ${props.maxPage}`),
      h('button', { disabled: props.page >= props.maxPage, class: 'btn-secondary min-h-9 px-3 py-1 disabled:opacity-40', onClick: () => emit('change', props.page + 1) }, '下一页'),
    ]) : null
  },
})

const route = useRoute()
const message = useMessage()
const loading = ref(true)
const notFound = ref(false)
const session = ref<ManagementSession | null>(null)
const authError = ref('')
const passkeyBusy = ref(false)
const webAuthnSupported = browserSupportsWebAuthn()
const enrollmentCode = ref('')
const deviceName = ref('')
const showEnrollmentForm = ref(false)
const requestedTab = typeof route.query.tab === 'string' ? route.query.tab : ''
const tab = ref<Tab>((['about', 'reports', 'announcements', 'uploads', 'files', 'notifications'] as const).includes(requestedTab as Tab) ? requestedTab as Tab : 'reports')
const sectionLoading = ref(false)
const sectionError = ref('')

const safeNext = computed(() => {
  const value = typeof route.query.next === 'string' ? route.query.next : ''
  return value.startsWith('/admin/') && !value.startsWith('//') ? value : ''
})
const availableTabs = computed<Tab[]>(() => {
  if (!session.value) return []
  const permissions = session.value.permissions
  return [
    permissions.moderate_reports && 'reports',
    permissions.publish_announcements && 'announcements',
    permissions.review_resource_uploads && 'uploads',
    permissions.manage_resource_files && 'files',
    permissions.manage_telegram_notifications && 'notifications',
    permissions.publish_announcements && 'about',
  ].filter((value): value is Tab => Boolean(value))
})

const errorMessage = (errors: Array<{ err_msg: string }> | undefined, fallback: string) => errors?.[0]?.err_msg || fallback

const displayResourceUrl = (rawUrl: unknown) => {
  const safeUrl = toSafeExternalUrl(rawUrl)
  if (!safeUrl) return ''
  try {
    return decodeURIComponent(safeUrl)
  } catch {
    return safeUrl
  }
}

type KeePassXCError = { code?: number; message?: string }

const keepassXCErrorHints: Record<number, string> = {
  25: '当前页面使用 http://localhost；请在 KeePassXC 主程序中打开“工具 → 设置 → 浏览器集成 → 高级”，并启用“允许将 localhost 用于 Passkey”。',
}

const withKeePassXCError = async <T>(operation: () => Promise<T>): Promise<T> => {
  const capturedExtensionError: { current: KeePassXCError | null } = { current: null }
  const captureError = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail
    if (!detail || typeof detail !== 'object') return
    const response = detail as { publicKey?: unknown; errorCode?: unknown; errorMessage?: unknown }
    if (response.publicKey) return
    const parsedCode = typeof response.errorCode === 'number'
      ? response.errorCode
      : typeof response.errorCode === 'string' && /^\d+$/.test(response.errorCode)
        ? Number(response.errorCode)
        : undefined
    const messageParts = [
      typeof response.errorMessage === 'string' ? response.errorMessage : '',
      parsedCode === undefined ? '' : keepassXCErrorHints[parsedCode] || '',
    ].filter(Boolean)
    const captured = {
      code: parsedCode,
      message: messageParts.join('；')
        || '扩展返回了空响应；请确认 KeePassXC 数据库已解锁且浏览器扩展显示已连接。',
    }
    // KeePassXC-Browser may emit a detailed native error followed by an empty
    // fallback response. Keep the actionable error instead of overwriting it.
    if (capturedExtensionError.current?.code !== undefined && captured.code === undefined) return
    capturedExtensionError.current = captured
  }

  document.addEventListener('kpxc-passkeys-response', captureError)
  try {
    return await operation()
  } catch (error) {
    const extensionError = capturedExtensionError.current
    if (!extensionError) throw error
    const originalMessage = error instanceof Error ? error.message : 'Passkey 操作失败。'
    const code = extensionError.code === undefined ? '' : `错误码 ${extensionError.code}`
    const detail = [code, extensionError.message].filter(Boolean).join('：')
    throw new Error(detail ? `${originalMessage}（KeePassXC-Browser ${detail}）` : originalMessage)
  } finally {
    document.removeEventListener('kpxc-passkeys-response', captureError)
  }
}

const loadSession = async () => {
  loading.value = true
  try {
    const response = await api.get({ url: '/api/management/session/' })
    if (response.status === 404) { notFound.value = true; return }
    if (response.status !== 200) throw new Error()
    session.value = response.content
    if (!availableTabs.value.includes(tab.value)) tab.value = availableTabs.value[0] || 'reports'
  } catch { notFound.value = true } finally { loading.value = false }
}

const registerPasskey = async () => {
  if (!webAuthnSupported) { authError.value = '当前浏览器不支持 WebAuthn。'; return }
  passkeyBusy.value = true
  authError.value = ''
  try {
    const wasEnrolled = Boolean(session.value?.passkey_enrolled)
    const options = await api.post({
      url: '/api/management/passkeys/registration/options/',
      query: { enrollment_code: enrollmentCode.value, name: deviceName.value },
    })
    if (options.status !== 200) throw new Error(errorMessage(options.errors, '注册许可无效或已过期。'))
    const credential = await withKeePassXCError(() => startRegistration({ optionsJSON: options.content }))
    const result = await api.post({ url: '/api/management/passkeys/registration/verify/', query: { credential } })
    if (result.status !== 201) throw new Error(errorMessage(result.errors, 'Passkey 绑定失败。'))
    enrollmentCode.value = ''
    deviceName.value = ''
    showEnrollmentForm.value = false
    if (!wasEnrolled && safeNext.value) { window.location.assign(safeNext.value); return }
    await loadSession()
  } catch (error) {
    authError.value = error instanceof Error ? error.message : 'Passkey 绑定失败。'
  } finally { passkeyBusy.value = false }
}

const authenticatePasskey = async () => {
  if (!webAuthnSupported) return
  passkeyBusy.value = true
  authError.value = ''
  try {
    const options = await api.post({ url: '/api/management/passkeys/authentication/options/' })
    if (options.status !== 200) throw new Error(errorMessage(options.errors, '无法开始 Passkey 验证。'))
    const credential = await withKeePassXCError(() => startAuthentication({ optionsJSON: options.content }))
    const result = await api.post({ url: '/api/management/passkeys/authentication/verify/', query: { credential } })
    if (result.status !== 200) throw new Error(errorMessage(result.errors, 'Passkey 验证失败。'))
    if (safeNext.value) { window.location.assign(safeNext.value); return }
    await loadSession()
  } catch (error) {
    authError.value = error instanceof Error ? error.message : 'Passkey 验证失败。'
  } finally { passkeyBusy.value = false }
}

const aboutContent = ref('')
const aboutLoading = ref(false)
const aboutBusy = ref(false)
const aboutError = ref('')
const aboutMessage = ref('')
const aboutSucceeded = ref(false)
let aboutRequestVersion = 0

const loadAbout = async () => {
  const requestVersion = ++aboutRequestVersion
  aboutLoading.value = true
  aboutError.value = ''
  sectionError.value = ''
  try {
    const response = await api.get({ url: '/api/management/about/' })
    if (requestVersion !== aboutRequestVersion) return
    if (response.status === 403) { await loadSession(); return }
    if (response.status !== 200) throw new Error(errorMessage(response.errors, '关于本站加载失败。'))
    aboutContent.value = response.content.about.content
  } catch (error) {
    if (requestVersion !== aboutRequestVersion) return
    aboutError.value = error instanceof Error ? error.message : '关于本站加载失败。'
  } finally {
    if (requestVersion === aboutRequestVersion) aboutLoading.value = false
  }
}

const saveAbout = async () => {
  if (aboutBusy.value || aboutError.value) return
  aboutBusy.value = true
  aboutMessage.value = ''
  aboutSucceeded.value = false
  try {
    const response = await api.put({ url: '/api/management/about/', query: { content: aboutContent.value } })
    if (response.status === 403) { await loadSession(); return }
    if (response.status !== 200) throw new Error(errorMessage(response.errors, '关于本站保存失败。'))
    aboutSucceeded.value = true
    aboutMessage.value = '内容已保存。'
    if (tab.value === 'about') await loadAbout()
  } catch (error) {
    aboutMessage.value = error instanceof Error ? error.message : '关于本站保存失败。'
  } finally { aboutBusy.value = false }
}

const reports = ref<ManagementReport[]>([])
const reportStatus = ref<'pending' | 'dismissed' | 'removed'>('pending')
const reportBoard = ref<'' | 'guestbook' | 'announcement'>('')
const reportPage = ref(1)
const reportMaxPage = ref(1)
const reportNotes = reactive<Record<number, string>>({})

const loadReports = async (page = 1) => {
  sectionLoading.value = true; sectionError.value = ''
  try {
    const response = await api.get({ url: '/api/management/reports/', query: { status: reportStatus.value, board: reportBoard.value || undefined, page, pageSize: 10 } })
    if (response.status === 403) { await loadSession(); return }
    if (response.status !== 200) throw new Error(errorMessage(response.errors, '举报加载失败。'))
    reports.value = response.content.results
    reportPage.value = response.content.page
    reportMaxPage.value = response.content.max_page
  } catch (error) { sectionError.value = error instanceof Error ? error.message : '举报加载失败。' } finally { sectionLoading.value = false }
}

const resolveReport = async (id: number, decision: 'dismiss' | 'remove') => {
  const note = reportNotes[id]?.trim()
  if (!note) { sectionError.value = '请先填写处理说明。'; return }
  if (decision === 'remove' && !confirm('确定移除该内容并处理它的全部待处理举报吗？')) return
  const response = await api.post({ url: '/api/management/reports/:id/resolve/', params: { id }, query: { decision, note } })
  if (response.status === 403) { await loadSession(); return }
  if (response.status !== 200) { sectionError.value = errorMessage(response.errors, '处理举报失败。'); return }
  await loadReports(reportPage.value)
}

const announcementTitle = ref('')
const announcementContent = ref('')
const announcementPriority = ref(0)
const editingAnnouncementId = ref<number | null>(null)
const announcementBusy = ref(false)
const announcementMessage = ref('')
const announcementSucceeded = ref(false)
const announcements = ref<GuestbookEntry[]>([])
const announcementVisibility = ref<'published' | 'hidden'>('published')
const announcementPage = ref(1)
const announcementMaxPage = ref(1)
const announcementActionId = ref<number | null>(null)
let announcementSubmissionId = crypto.randomUUID()
let announcementRequestVersion = 0

const resetAnnouncementEditor = () => {
  editingAnnouncementId.value = null
  announcementTitle.value = ''
  announcementContent.value = ''
  announcementPriority.value = 0
  announcementSubmissionId = crypto.randomUUID()
}

const loadAnnouncements = async (page = 1) => {
  const requestVersion = ++announcementRequestVersion
  const visibility = announcementVisibility.value
  sectionLoading.value = true; sectionError.value = ''
  try {
    const response = await api.get({
      url: '/api/management/announcements/',
      query: { visibility, page, pageSize: 10 },
    })
    if (requestVersion !== announcementRequestVersion) return
    if (response.status === 403) { await loadSession(); return }
    if (response.status !== 200) throw new Error(errorMessage(response.errors, '公告加载失败。'))
    announcements.value = response.content.results
    announcementPage.value = response.content.page
    announcementMaxPage.value = response.content.max_page
  } catch (error) {
    if (requestVersion !== announcementRequestVersion) return
    sectionError.value = error instanceof Error ? error.message : '公告加载失败。'
  } finally {
    if (requestVersion === announcementRequestVersion) sectionLoading.value = false
  }
}

const editAnnouncement = (announcement: GuestbookEntry) => {
  editingAnnouncementId.value = announcement.id
  announcementTitle.value = announcement.title || ''
  announcementContent.value = announcement.content
  announcementPriority.value = announcement.priority
  announcementMessage.value = ''
}

const saveAnnouncement = async () => {
  announcementSucceeded.value = false
  const operation = {
    editingId: editingAnnouncementId.value,
    title: announcementTitle.value,
    content: announcementContent.value,
    priority: announcementPriority.value,
    submissionId: announcementSubmissionId,
  }
  if (!operation.title || !operation.content) { announcementMessage.value = '标题和正文不能为空。'; return }
  if (!Number.isInteger(operation.priority) || operation.priority < -100 || operation.priority > 100) {
    announcementSucceeded.value = false
    announcementMessage.value = '优先级必须是 -100 到 100 之间的整数。'
    return
  }
  announcementBusy.value = true; announcementMessage.value = ''
  try {
    const response = operation.editingId === null
      ? await api.post({
          url: '/api/management/announcements/',
          query: { title: operation.title, content: operation.content, priority: operation.priority, submission_id: operation.submissionId },
        })
      : await api.put({
          url: '/api/management/announcements/:id/',
          params: { id: operation.editingId },
          query: { title: operation.title, content: operation.content, priority: operation.priority },
        })
    if (response.status === 403) { await loadSession(); return }
    if (response.status !== 200 && response.status !== 201) throw new Error(errorMessage(response.errors, '公告发布失败。'))
    announcementSucceeded.value = true
    announcementMessage.value = operation.editingId === null
      ? ('created' in response.content && response.content.created ? '公告已发布。' : '该公告已经发布。')
      : '公告已更新。'
    resetAnnouncementEditor()
    if (tab.value === 'announcements') await loadAnnouncements(announcementPage.value)
  } catch (error) { announcementSucceeded.value = false; announcementMessage.value = error instanceof Error ? error.message : '公告发布失败。' } finally { announcementBusy.value = false }
}

const toggleAnnouncementVisibility = async (announcement: GuestbookEntry) => {
  announcementActionId.value = announcement.id
  announcementMessage.value = ''
  announcementSucceeded.value = false
  const nextPage = announcements.value.length === 1 && announcementPage.value > 1 ? announcementPage.value - 1 : announcementPage.value
  try {
    const response = await api.post({
      url: '/api/management/announcements/:id/visibility/',
      params: { id: announcement.id },
      query: { visible: !announcement.is_visible },
    })
    if (response.status === 403) { await loadSession(); return }
    if (response.status !== 200) throw new Error(errorMessage(response.errors, '公告状态更新失败。'))
    announcementSucceeded.value = true
    announcementMessage.value = response.content.entry.is_visible ? '公告已发布。' : '公告已隐藏。'
    if (editingAnnouncementId.value === announcement.id) resetAnnouncementEditor()
    if (tab.value === 'announcements') await loadAnnouncements(nextPage)
  } catch (error) {
    announcementSucceeded.value = false
    announcementMessage.value = error instanceof Error ? error.message : '公告状态更新失败。'
  } finally { announcementActionId.value = null }
}

const deleteAnnouncement = async (announcement: GuestbookEntry) => {
  if (announcement.is_visible || !confirm('确定从公告管理中移除这条已隐藏的公告吗？移除后无法在管理界面恢复。')) return
  announcementActionId.value = announcement.id
  announcementMessage.value = ''
  announcementSucceeded.value = false
  const nextPage = announcements.value.length === 1 && announcementPage.value > 1 ? announcementPage.value - 1 : announcementPage.value
  try {
    const response = await api.delete({ url: '/api/management/announcements/:id/', params: { id: announcement.id } })
    if (response.status === 403) { await loadSession(); return }
    if (response.status !== 200) throw new Error(errorMessage(response.errors, '公告删除失败。'))
    announcementSucceeded.value = true
    announcementMessage.value = '公告已删除。'
    if (editingAnnouncementId.value === announcement.id) resetAnnouncementEditor()
    if (tab.value === 'announcements') await loadAnnouncements(nextPage)
  } catch (error) {
    announcementSucceeded.value = false
    announcementMessage.value = error instanceof Error ? error.message : '公告删除失败。'
  } finally { announcementActionId.value = null }
}

const telegramSettings = reactive<TelegramNotificationSettings>({
  user_registration_enabled: true,
  guestbook_entry_enabled: true,
  course_review_enabled: true,
  reply_enabled: true,
})
const telegramSwitches: Array<{ key: keyof TelegramNotificationSettings; label: string; description: string }> = [
  { key: 'user_registration_enabled', label: '用户注册', description: '新用户提交注册并创建账号时通知。' },
  { key: 'guestbook_entry_enabled', label: '发表留言', description: '用户在留言板发布新的顶层留言时通知。' },
  { key: 'course_review_enabled', label: '发表课程评价', description: '用户发布新的课程评价时通知；编辑评价不重复通知。' },
  { key: 'reply_enabled', label: '发表回复', description: '留言、公告或课程评价出现新回复时通知。' },
]
const telegramBusy = ref(false)
const telegramMessage = ref('')
const telegramSucceeded = ref(false)

const loadTelegramSettings = async () => {
  sectionLoading.value = true; sectionError.value = ''; telegramMessage.value = ''
  try {
    const response = await api.get({ url: '/api/management/notifications/telegram/' })
    if (response.status === 403) { await loadSession(); return }
    if (response.status !== 200) throw new Error(errorMessage(response.errors, 'Telegram 通知设置加载失败。'))
    Object.assign(telegramSettings, response.content)
  } catch (error) { sectionError.value = error instanceof Error ? error.message : 'Telegram 通知设置加载失败。' } finally { sectionLoading.value = false }
}

const saveTelegramSettings = async () => {
  telegramBusy.value = true; telegramMessage.value = ''
  try {
    const response = await api.post({ url: '/api/management/notifications/telegram/', query: { ...telegramSettings } })
    if (response.status === 403) { await loadSession(); return }
    if (response.status !== 200) throw new Error(errorMessage(response.errors, 'Telegram 通知设置保存失败。'))
    Object.assign(telegramSettings, response.content)
    telegramSucceeded.value = true; telegramMessage.value = '设置已保存。'
  } catch (error) { telegramSucceeded.value = false; telegramMessage.value = error instanceof Error ? error.message : 'Telegram 通知设置保存失败。' } finally { telegramBusy.value = false }
}

const uploads = ref<ResourceUploadRequest[]>([])
const showUploadBlacklist = ref(false)
const uploadStatus = ref<ResourceUploadRequest['status'] | ''>('pending')
const uploadPage = ref(1)
const uploadMaxPage = ref(1)
const uploadPaths = reactive<Record<number, string>>({})
const uploadReasons = reactive<Record<number, string>>({})

const loadUploads = async (page = 1) => {
  sectionLoading.value = true; sectionError.value = ''
  try {
    const response = await api.get({ url: '/api/management/uploads/', query: { status: uploadStatus.value || undefined, page, pageSize: 10 } })
    if (response.status === 403) { await loadSession(); return }
    if (response.status !== 200) throw new Error(errorMessage(response.errors, '投稿加载失败。'))
    uploads.value = response.content.results
    for (const upload of uploads.value) uploadPaths[upload.id] = upload.target_path
    uploadPage.value = response.content.page; uploadMaxPage.value = response.content.max_page
  } catch (error) { sectionError.value = error instanceof Error ? error.message : '投稿加载失败。' } finally { sectionLoading.value = false }
}

const reviewUpload = async (upload: ResourceUploadRequest, action: 'approve' | 'reject' | 'retry') => {
  if (action === 'reject' && !uploadReasons[upload.id]?.trim()) { sectionError.value = '拒绝投稿时必须填写理由。'; return }
  const response = await api.post({
    url: '/api/management/uploads/:id/', params: { id: upload.id },
    query: { action, expected_revision: upload.revision, target_path: uploadPaths[upload.id], reason: uploadReasons[upload.id] },
  })
  if (response.status === 403) { await loadSession(); return }
  if (response.status !== 200) { sectionError.value = errorMessage(response.errors, '审核投稿失败。'); return }
  if (action === 'approve') message.success('审核已通过，资料正在发布。')
  await loadUploads(uploadPage.value)
}

const selectTab = (value: Tab) => { tab.value = value }
const tabClass = (value: Tab) => [
  'rounded-lg border px-4 py-2 text-sm font-medium shadow-sm transition-colors',
  tab.value === value
    ? 'border-blue-600 bg-blue-600 text-white'
    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
]
const reasonLabel = (value: ManagementReport['reason']) => ({ spam: '垃圾广告', abuse: '攻击辱骂', privacy: '泄露隐私', other: '其他' })[value]
const uploadStatusLabel = (value: ResourceUploadRequest['status']) => ({ pending: '待审核', publishing: '发布中', approved: '已通过', rejected: '已拒绝', publish_failed: '发布失败' })[value]
const formatDate = (value: string) => new Date(value).toLocaleString('zh-CN')

watch(tab, value => {
  if (value !== 'about') aboutRequestVersion += 1
  if (value !== 'announcements') announcementRequestVersion += 1
  if (value === 'about') void loadAbout()
  if (value === 'reports') void loadReports()
  if (value === 'announcements') void loadAnnouncements()
  if (value === 'uploads') void loadUploads()
  if (value === 'notifications') void loadTelegramSettings()
})
watch(() => session.value?.elevated, elevated => { if (elevated && tab.value === 'about') void loadAbout(); if (elevated && tab.value === 'reports') void loadReports(); if (elevated && tab.value === 'announcements') void loadAnnouncements(); if (elevated && tab.value === 'uploads') void loadUploads(); if (elevated && tab.value === 'notifications') void loadTelegramSettings() })
onMounted(loadSession)
</script>
