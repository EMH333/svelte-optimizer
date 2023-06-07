<script>
    import { constant1 } from './constants.js';
    export let used1 = constant1[0];
    import * as constants from './constants.js';
    export let used2 = constants.constant2.test;
    import { constant3 as c3 } from './constants.js';
    export let used3 = c3["prop"];
    import constantsPlain from './constants.js';
    export let used4 = constantsPlain.constant4;
</script>

<p>{used1}</p>
<p>{used2}</p>
<p>{used3}</p>
<p>{used4}</p>

