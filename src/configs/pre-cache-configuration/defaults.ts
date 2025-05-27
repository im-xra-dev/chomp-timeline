import { DiscoveryModes } from '../../utils/DiscoveryModes';

export const defaults = {
    [DiscoveryModes.FOLLOWED_USER]: {
        skip: 0,
        limit: 100,
        cacheSize: 10,
    },
    [DiscoveryModes.RECOMMENDED_USER]: {
        skip: 0,
        limit: 50,
        cacheSize: 5,
    },
    [DiscoveryModes.FOLLOWED_SUBSECTION]: {
        skip: 0,
        limit: 100,
        cacheSize: 10,
    },
    [DiscoveryModes.RECOMMENDED_SUBSECTION]: {
        skip: 0,
        limit: 50,
        cacheSize: 5,
    },
}