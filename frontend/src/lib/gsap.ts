import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register once for the whole app. Import this module for its side effect from
// the app entry; import { gsap, useGSAP, ScrollTrigger } from here elsewhere.
gsap.registerPlugin(useGSAP, ScrollTrigger);

export { gsap, useGSAP, ScrollTrigger };
