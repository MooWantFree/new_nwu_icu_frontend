import { beforeEach } from 'vitest'
import { siteConfig } from '@/lib/siteConfig'

export const siteConfigFixture = {
  "site_name": "NWU.ICU",
  "site_origin": "https://nwu.icu",
  "university_name": "西北大学",
  "university_short_name": "西大",
  "college_email_domains": [
    "nwu.edu.cn",
    "stumail.nwu.edu.cn"
  ],
  "registration_blocked_email_domains": [
    "nwu.edu.cn"
  ],
  "navigation_links": [
    {
      "label": "教务管理系统",
      "url": "https://jwgl.nwu.edu.cn/sso/jziotlogin"
    },
    {
      "label": "图书馆自助打印",
      "url": "https://weixinprinthost.woquyun.com/wq-web/#/index"
    },
    {
      "label": "西大邮箱",
      "url": "https://mail.stumail.nwu.edu.cn/"
    },
    {
      "label": "WEB VPN",
      "url": "https://webvpn.nwu.edu.cn/"
    },
    {
      "label": "彩虹体育馆预约",
      "url": "http://cgzx.nwu.edu.cn:8080/venues/auth"
    },
    {
      "label": "图书馆馆藏检索",
      "url": "https://agentdockingopac.featurelib.libsou.com/showhome/search/showSearch?schoolId=25"
    },
    {
      "label": "班车时刻表",
      "url": "https://hqjt.nwu.edu.cn/fwdt/bcsk.htm"
    },
    {
      "label": "西大电话",
      "url": "https://www.nwu.edu.cn/ggzy/xddh.htm"
    },
    {
      "label": "正版软件",
      "url": "https://zhengban.nwu.edu.cn/"
    }
  ],
  "analytics": {
    "website_id": "",
    "domains": []
  },
  "sentry_dsn": "",
  "footer_start_year": 2019,
  "frontend_repository_url": "",
  "backend_repository_url": ""
}

beforeEach(() => Object.assign(siteConfig, structuredClone(siteConfigFixture)))
