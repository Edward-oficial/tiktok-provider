import { HttpsProxyAgent } from 'https-proxy-agent';

const PROXY_URL = "http://qmefplrt:p6d27d6c5uku@31.59.20.176:6754";

export const proxyAgent = new HttpsProxyAgent(PROXY_URL);
