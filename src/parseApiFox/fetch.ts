import https from 'https';
import http from 'http';
import { URL } from 'url';

/**
 * 发起 GET 请求，返回 Promise<json对象>
 * @param url 请求地址
 * @returns Promise<any>
 */
export function fetchJson(url: string): Promise<any> {
  url += '.data';
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.get(url, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e: any) {
          reject(new Error('Invalid JSON: ' + e.message));
        }
      });
    });
    req.on('error', reject);
  });
}
export function fetch(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.get(url, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(data);
        } catch (e: any) {
          reject(new Error('Invalid JSON: ' + e.message));
        }
      });
    });
    req.on('error', reject);
  });
}

// 用法示例
// fetchJson('https://api.github.com').then(console.log).catch(console.error);
