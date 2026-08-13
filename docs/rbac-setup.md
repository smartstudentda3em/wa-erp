# الأدوار والصلاحيات (RBAC) — دليل الدمج

## 1) الحزمة والإعداد
```bash
composer require spatie/laravel-permission
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
php artisan migrate
php artisan db:seed --class=Database\\Seeders\\RoleSeeder
```

## 2) تفعيل الأدوار على الموديل
`app/Models/User.php` يستخدم `Spatie\Permission\Traits\HasRoles` (مضمّن مسبقاً).

## 3) الأدوار والصلاحيات (من RoleSeeder)
| الصلاحية | admin | manager | agent |
|---|:--:|:--:|:--:|
| `conversations.view_all` | ✅ | ✅ | ❌ |
| `conversations.assign` | ✅ | ✅ | ❌ |
| `conversations.close` | ✅ | ✅ | ❌ |
| `campaigns.manage` | ✅ | ✅ | ❌ |
| `customers.manage` | ✅ | ✅ | ❌ |

> الموظف (agent) بلا صلاحيات صريحة: يرى المحادثات **المسندة إليه أو غير المسندة** فقط،
> ويمكنه الإرسال والإغلاق **لمحادثاته**، لكن لا يحوّل لموظف آخر.

## 4) نقاط دمج مهمة عند النسخ للمشروع
- **`app/Http/Controllers/Controller.php`**: هذا الملف يستبدل الأساس الافتراضي في Laravel 11
  ليضيف `AuthorizesRequests` (يمكّن `$this->authorize(...)`). لا تُبقِ الملف الافتراضي الفارغ.
- **اكتشاف السياسة تلقائي**: `App\Policies\ConversationPolicy` يُكتشف تلقائياً لموديل
  `Conversation` بحكم التسمية في Laravel 11 — لا حاجة لتسجيله في `AuthServiceProvider`.
- **صلاحيات كـ Gates**: Spatie يسجّل الصلاحيات في Gate تلقائياً، لذا
  `$this->authorize('campaigns.manage')` و`$user->can('...')` يعملان مباشرة.

## 5) أين طُبّقت الحماية
| الإجراء | الحماية |
|---|---|
| `GET /conversations` | فلترة تلقائية: agent يرى المسندة/غير المسندة فقط |
| `GET /conversations/{id}` | `authorize('view')` |
| `POST .../assign` | `authorize('assign')` — مديرون فقط |
| `POST .../close` \| `reopen` | `authorize('close')` — مدير أو صاحب المحادثة |
| `POST .../messages*` | `authorize('sendMessage')` |
| `POST /campaigns` \| `launch` \| `cancel` | `authorize('campaigns.manage')` |

## 6) في الواجهة (React)
أخفِ الأزرار حسب الدور لتجربة أنظف (الحماية الفعلية في الـ Backend تبقى المرجع):
```jsx
// مثال: جلب أدوار المستخدم عند تسجيل الدخول وتخزينها، ثم:
{user.can('conversations.assign') && <TransferButton />}
```
