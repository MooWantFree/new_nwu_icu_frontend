import type { ProfilePage, ResetPassword, User } from './user'
import type { Profile, Review, Reply, Course, Teacher } from './courseReview'
import type { Messages, Inbox, Like } from './messages'
import type { Search } from './search'
import type { Captcha } from './captcha'
import type { Text } from './text'
import type { FileAPI } from './file'
import { MethodMap } from './base'

export type RequestEndpoints = {
  [MethodMap.GET]: {
    // User
    // - Profile
    '/api/assessment/user/activities/review/:id/': ProfilePage.APIUserActivitiesReview
    '/api/assessment/user/activities/reply/:id/': ProfilePage.APIUserActivitiesReply
    '/api/user/profile/': ProfilePage.APIUserProfile
    '/api/user/profile/:id/': ProfilePage.APIUserProfileGivenId
    '/api/user/bind-college-email/verify/': ProfilePage.APIVerifyScholarEmail
    '/api/user/private/': ProfilePage.APIPrivate
    // - Reset Password
    '/api/user/mail-reset/:token/': ResetPassword.APIVerifyResetPasswordToken
    // - User
    '/api/user/register/': User.APIActivateAccount

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
    '/api/tos/': Text.APITos
    '/api/about/': Text.APIAbout

    // File
    '/api/download/:uuid/': FileAPI.APIFileDownload

    // Messages
    '/api/message/user/': Inbox.APIUserMessageList
    '/api/message/user/:id': Inbox.APIUserMessageDetail
    '/api/message/like/': Like.APILikeList
    '/api/message/reply/': Messages.APINotificationList
    '/api/message/unread/': Messages.APIUnreadMessageCount
  }
  [MethodMap.POST]: {
    // User
    // - Profile
    '/api/user/bind-college-email/bind/': ProfilePage.APIBindScholarEmail
    '/api/user/profile/': ProfilePage.APIUpdateProfile
    // - Reset Password
    '/api/user/reset/': ResetPassword.APIResetPassword
    '/api/user/mail-reset/:token/': ResetPassword.APIResetPasswordToken
    '/api/user/reset-login/': ResetPassword.APIUserResetPassword
    // - User
    '/api/user/register/': User.APIRegister
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

    // Message
    '/api/message/': Inbox.APISendMessage
  }
  [MethodMap.DELETE]: {
    // CourseReview
    // - Review
    '/api/assessment/review/': Review.APIDeleteReview
    // - Reply
    '/api/assessment/reply/': Reply.APIDeleteReply

    // File
    '/api/delete/:uuid/': FileAPI.APIFileDelete
  }
  [MethodMap.PUT]: {
    // CourseReview
    // - Review
    '/api/assessment/review/': Review.APIUpdateReview
  }
}