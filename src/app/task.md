# Task: Verify Admin Functionality and Code Cleanup

- [x] Integrate `sonner` for toast notifications <!-- id: 1 -->
- [x] Replace `alert()` and `confirm()` in user-facing pages <!-- id: 2 -->
- [x] Replace `alert()` and `confirm()` in Admin hooks and components <!-- id: 3 -->
- [x] Verify Admin functionality (participants, brackets, settings) <!-- id: 4 -->
- [x] Verify no regressions in payment or user flows <!-- id: 5 -->
- [x] Verify complete removal of native dialogs <!-- id: 6 -->

## Notes

- All native `alert` and `confirm` dialogs have been replaced with `sonner` toasts.
- Admin panel functions for tournament management (start, reset, delete), participant management (revoke), and match management (finalize, update status) have been updated to use toast notifications.
- Syntax errors introduced during refatoring have been fixed.
