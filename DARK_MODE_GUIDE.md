/**
 * Dark Mode Update Script - Common Class Replacements
 * 
 * This document lists all the common class replacements needed for dark mode.
 * Use Find & Replace in your editor to apply these systematically across all .tsx files.
 * 
 * BACKGROUND CLASSES:
 * - bg-white -> bg-white dark:bg-card-dark
 * - bg-card-light -> bg-card-light dark:bg-card-dark
 * - bg-background-light -> bg-background-light dark:bg-background-dark
 * - bg-gray-50 -> bg-gray-50 dark:bg-gray-800
 * - bg-gray-100 -> bg-gray-100 dark:bg-gray-900
 * 
 * TEXT CLASSES:
 * - text-text-light -> text-text-light dark:text-text-dark (where text-dark is now #ffffff)
 * - text-gray-800 -> text-gray-800 dark:text-white
 * - text-gray-700 -> text-gray-700 dark:text-gray-200
 * - text-gray-600 -> text-gray-600 dark:text-gray-300
 * - text-gray-500 -> text-gray-500 dark:text-gray-400
 * - text-muted -> text-muted dark:text-muted-dark (where muted-dark is now #cbd5e1)
 * 
 * BORDER CLASSES:
 * - border-border-light -> border-border-light dark:border-border-dark
 * - border-gray-200 -> border-gray-200 dark:border-gray-700
 * - border-gray-300 -> border-gray-300 dark:border-gray-600
 * 
 * HOVER STATES:
 * - hover:bg-gray-100 -> hover:bg-gray-100 dark:hover:bg-gray-800
 * - hover:bg-gray-50 -> hover:bg-gray-50 dark:hover:bg-gray-900
 * 
 * INPUT FIELDS:
 * Add to input/select/textarea elements:
 * className="... dark:bg-input-dark dark:text-text-dark dark:border-border-dark"
 * 
 * MODALS/OVERLAYS:
 * Ensure modal backgrounds ar dark:bg-card-dark
 * Ensure overlay backgrounds remain dark (bg-black/50)
 */

/**
 * PAGES TO UPDATE (in order of priority):
 * 1. AdminDashboard.tsx - Done partially (needs cards, charts)
 * 2. TeacherDashboard.tsx - Needs full update
 * 3. AdminPanel.tsx - Needs full update
 * 4. Registration.tsx - Needs inputs and cards
 * 5. Attendance.tsx - Needs forms and modals
 * 6. Reports.tsx - Needs tables and charts
 * 7. Notices.tsx - Needs cards and modals
 * 8. Turmas.tsx - Needs cards and tables
 * 9. Calendar.tsx - Needs calendar cells
 * 10. Enrollment.tsx - Needs tables
 * 11. AttendanceHistory.tsx - Needs tables
 * 12. PermissionsManagement.tsx - Needs tables
 */
