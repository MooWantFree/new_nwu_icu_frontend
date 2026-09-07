import type { ProfilePage, ResetPassword, User } from './user'
import type { Profile, Review, Reply, Course, Teacher } from './courseReview'
import type { Messages, Inbox, Like } from './messages'
import type { Search } from './search'
import type { Captcha } from './captcha'
import type { Text } from './text'
import type { FileAPI } from './file'
import type {
  APIAnnouncementContext,
  APIAnnouncementDetail,
  APIAnnouncementList,
  APIGuestbookContext,
  APIGuestbookDetail,
  APIGuestbookList,
  APIGuestbookReplies,
} from './guestbook'
import type {
  APIResourceDirectories,
  APIResourceUploadConfig,
  APIResourceUploadCreate,
  APIResourceUploadList,
  APIResourceUploadUpdate,
} from './resourceUpload'
import { MethodMap } from './base'
import type * as ResourceTools from './resourceTools'
import type {
  APIManagementResourceFiles,
  APIManagementResourceTrash,
  APIManagementResourceUpload,
  APIManagementResourceAction,
  APIManagementAnnouncementCreate,
  APIManagementPasskeyAuthenticationOptions,
  APIManagementPasskeyAuthenticationVerify,
  APIManagementPasskeyRegistrationOptions,
  APIManagementPasskeyRegistrationVerify,
  APIManagementReportList,
  APIManagementReportResolve,
  APIManagementSession,
  APIManagementUploadDetail,
  APIManagementUploadList,
  APIManagementUploadReview,
  APIManagementUploadBlacklist,
  APIManagementUploadBlacklistUpdate,
  APIManagementUploadDirectories,
} from './management'

export type RequestEndpoints = {
  [MethodMap.GET]: {
    '/api/management/resources/readme/': ResourceTools.APIReadme
    '/api/management/resources/access/': ResourceTools.APIAccess
    '/api/management/resources/index/': ResourceTools.APIIndex
    '/api/management/resources/audit/': ResourceTools.APIAudit
    '/api/management/resources/statistics/': ResourceTools.APIStatistics
    '/api/management/resources/': APIManagementResourceFiles
    '/api/management/resources/trash/': APIManagementResourceTrash
    '/api/management/session/': APIManagementSession
    '/api/management/reports/': APIManagementReportList
    '/api/management/uploads/': APIManagementUploadList
    '/api/management/uploads/blacklist/': APIManagementUploadBlacklist
    '/api/management/uploads/directories/': APIManagementUploadDirectories
    '/api/management/uploads/:id/': APIManagementUploadDetail
    // User
    // - Profile
    '/api/assessment/user/activities/review/:id/': ProfilePage.APIUserActivitiesReview
    '/api/assessment/user/activities/reply/:id/': ProfilePage.APIUserActivitiesReply
    '/api/user/profile/': ProfilePage.APIUserProfile
    '/api/user/profile/:id/': ProfilePage.APIUserProfileGivenId
    '/api/user/private/': ProfilePage.APIPrivate

    // CourseReview
    // - Profile
    '/api/assessment/my/reply/': Profile.APIMyReply
    // - Review
    '/api/assessment/latest-review/': Review.APILatestReviews
    // - Reply
    '/api/assessment/reply/:id/': Reply.APIGetReply
    // - Course
    '/api/assessment/courselist/': Course.APICourseList
    '/api/assessment/school/': Course.APISchoolList
    '/api/assessment/course/:id/': Course.APICourseInfo
    '/api/assessment/semester/': Course.APISemesterList
    // - Teacher
    '/api/assessment/teacher/:id/': Teacher.APITeacherInfo
    '/api/assessment/teacher/': Teacher.APITeacherList

    // Captcha
    '/api/captcha/': Captcha.APICaptcha

    // Text
    '/api/blogs/': Text.APITos
    '/api/blogs/:id': Text.APIBlogDetail
    '/api/about/': Text.APIAbout
    '/api/bulletins/': Text.APIBulletins

    // File
    '/api/download/:uuid/': FileAPI.APIFileDownload
  '/api/upload/directories/': APIResourceDirectories
  '/api/upload/config/': APIResourceUploadConfig
    '/api/upload/request/': APIResourceUploadList

    // Messages
    '/api/message/user/': Inbox.APIUserMessageList
    '/api/message/user/:id': Inbox.APIUserMessageDetail
    '/api/message/like/': Like.APILikeList
    '/api/message/reply/': Messages.APINotificationList
    '/api/message/system/': Messages.APISystemNotificationList
    '/api/message/unread/': Messages.APIUnreadMessageCount
    '/api/guestbook/': APIGuestbookList
    '/api/guestbook/:id/': APIGuestbookDetail
    '/api/guestbook/:id/replies/': APIGuestbookReplies
    '/api/guestbook/:id/context/': APIGuestbookContext
    '/api/announcements/': APIAnnouncementList
    '/api/announcements/:id/': APIAnnouncementDetail
    '/api/announcements/:id/replies/': import('./guestbook').APIAnnouncementReplies
    '/api/announcements/:id/context/': APIAnnouncementContext

    // Disk
    // Since Alist's API format is not same as present, so another method is used for it.
  }
  [MethodMap.POST]: {
    '/api/management/resources/operations/': ResourceTools.APIOperations
    '/api/management/resources/readme/': ResourceTools.APISaveReadme
    '/api/management/resources/access/': ResourceTools.APISaveAccess
    '/api/management/resources/index/': ResourceTools.APIReindex
    '/api/management/resources/upload/': APIManagementResourceUpload
    '/api/management/resources/action/': APIManagementResourceAction
    '/api/management/passkeys/authentication/options/': APIManagementPasskeyAuthenticationOptions
    '/api/management/passkeys/authentication/verify/': APIManagementPasskeyAuthenticationVerify
    '/api/management/passkeys/registration/options/': APIManagementPasskeyRegistrationOptions
    '/api/management/passkeys/registration/verify/': APIManagementPasskeyRegistrationVerify
    '/api/management/reports/:id/resolve/': APIManagementReportResolve
    '/api/management/announcements/': APIManagementAnnouncementCreate
    '/api/management/uploads/:id/': APIManagementUploadReview
    '/api/management/uploads/blacklist/': APIManagementUploadBlacklistUpdate
    // User
    // - Profile
    '/api/user/bind-college-email/bind/': ProfilePage.APIBindScholarEmail
    '/api/user/bind-college-email/verify/': ProfilePage.APIVerifyScholarEmail
    '/api/user/profile/': ProfilePage.APIUpdateProfile
    '/api/user/private/': ProfilePage.APIUpdatePrivate
    // - Reset Password
    '/api/user/reset/': ResetPassword.APIResetPassword
    '/api/user/mail-reset/': ResetPassword.APIResetPasswordToken
    '/api/user/mail-reset/verify/': ResetPassword.APIVerifyResetPasswordToken
    '/api/user/reset-login/': ResetPassword.APIUserResetPassword
    // - User
    '/api/user/register/': User.APIRegister
    '/api/user/register/activate/': User.APIActivateAccount
    '/api/user/login/': User.APILogin
    '/api/user/logout/': User.APILogout
    '/api/user/username/': User.APICheckUsername
    '/api/user/active/': User.APISendActivateEmail

    // CourseReview
    // - Review
    '/api/assessment/review/': Review.APIPostReview
    '/api/assessment/reply/like/': Review.APIPostReplyLike
    // - Reply
    '/api/assessment/reply/': Reply.APIPostReply
    // - Course
    '/api/assessment/course/like/': Course.APILikeNDislikeCourse
    '/api/assessment/course/': Course.APICourseNew
    // - Teacher
    '/api/assessment/teacher/': Teacher.APITeacherNew

    // Search
    '/api/search/': Search.APISearch

    // Captcha
    '/api/captcha/': Captcha.APICaptcha

    // File
    '/api/upload/': FileAPI.APIUploadFile
    '/api/upload/request/': APIResourceUploadCreate

    // Message
    '/api/message/': Inbox.APISendMessage
    '/api/message/user/:id/read/': Inbox.APIReadConversation
    '/api/message/notifications/read/': Messages.APIReadNotifications
    '/api/guestbook/': import('./guestbook').APICreateGuestbook
    '/api/guestbook/:id/replies/': import('./guestbook').APICreateGuestbookReply
    '/api/guestbook/:id/reports/': import('./guestbook').APIReportGuestbook
    '/api/announcements/': import('./guestbook').APICreateAnnouncement
    '/api/announcements/:id/replies/': import('./guestbook').APICreateAnnouncementReply
    '/api/announcements/:id/reports/': import('./guestbook').APIReportAnnouncement
  }
  [MethodMap.DELETE]: {
    // CourseReview
    // - Review
    '/api/assessment/review/': Review.APIDeleteReview
    // - Reply
    '/api/assessment/reply/': Reply.APIDeleteReply

    // File
    '/api/delete/:uuid/': FileAPI.APIFileDelete
    '/api/guestbook/:id/': import('./guestbook').APIDeleteGuestbook
    '/api/announcements/:id/': import('./guestbook').APIDeleteAnnouncement
  }
  [MethodMap.PUT]: {
    // CourseReview
    // - Review
    '/api/assessment/review/': Review.APIUpdateReview
    '/api/upload/request/:requestId/': APIResourceUploadUpdate
    '/api/guestbook/:id/like/': import('./guestbook').APISetGuestbookLike
    '/api/announcements/:id/like/': import('./guestbook').APISetAnnouncementLike
  }
}
