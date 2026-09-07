import type {Engine} from '../../packages/app-inspection/service';

const supported:Engine[]=['chromium','firefox','webkit'];
const requested=process.env.MAVONA_TEST_BROWSER_ENGINES?.split(',').filter(Boolean);

if(requested&&(requested.some(engine=>!supported.includes(engine as Engine))||new Set(requested).size!==requested.length))throw new Error('MAVONA_TEST_BROWSER_ENGINES must contain unique supported browser names');

export const browserEngines:Engine[]=requested?.length?requested as Engine[]:supported;
