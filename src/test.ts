import { sleep } from 'k6';
import { Options } from 'k6/options';
import {Form} from './nform-wrapper/wrapper';
import 'regenerator-runtime'

export let options:Options = {
  vus: 1,
  duration: '10s'
};

export default () => {
    run(1);
    sleep(1);
};

export const run = async (index: number) => {
    const form = new Form('ORDERS', index);
    form.start()
};
