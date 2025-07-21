import Alpine from "@alpinejs/csp";
import ajax from '@imacrayon/alpine-ajax'

window.Alpine = Alpine;
Alpine.plugin(ajax);
Alpine.start();