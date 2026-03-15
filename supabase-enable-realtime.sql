-- قم بتنفيذ هذا الكود في Supabase SQL Editor لتفعيل ميزة الـ Realtime على جدول الإشعارات
-- Supabase Dashboard > SQL Editor > New Query > Paste & Run

-- 1. تمكين الـ Realtime على جدول notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- (تأكيد) إذا واجهت خطأ بأن الجدول موجود مسبقاً في الـ publication، فهذا يعني أنه مفعل بالفعل.
-- يمكنك تجاهل الخطأ في هذه الحالة.
