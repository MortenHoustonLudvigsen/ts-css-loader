import { loader } from 'webpack';

export default function cssTypesLoader(source: string, map: any) {
    // Pass source and map on to next loader
    this.callback(null, source, map);
}
