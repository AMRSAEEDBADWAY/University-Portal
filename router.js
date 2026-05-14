/**
 * router.js — University Portal
 * التنقل أصبح تحميلاً كاملاً للصفحة (بدون SPA) لتفادي كسر التصميم،
 * وفقدان المودالات والسكربتات التي تقع خارج .main-wrapper.
 * يبقى هذا الملف لتحسين بسيط اختياري على أول تحميل.
 */
(function () {
    var TRANSITION_MS = 200;

    window.addEventListener("DOMContentLoaded", function () {
        var content = document.querySelector(".main-wrapper");
        if (content) {
            content.style.transition =
                "opacity " + TRANSITION_MS + "ms ease, transform " + TRANSITION_MS + "ms ease";
        }
    });
})();
