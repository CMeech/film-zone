import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

window.gsap = gsap; // Make it global if Alpine needs to access it in x-init

gsap.registerPlugin(ScrollTrigger);