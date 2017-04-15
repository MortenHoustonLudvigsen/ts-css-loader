import 'source-map-support/register';
import { runTests } from './run-tests';

try {
    runTests();
} catch (err) {
    console.error(err);
    process.exitCode = 1;
}

