import crypto from 'crypto';
import https from 'https';

export default function Translate({
  appId,
  q,
  key,
  from = 'auto',
  to = 'en',
}: {
  appId: number;
  q: string;
  key: string;
  from?: string;
  to?: string;
}) {
  return new Promise((resolve, reject) => {
    const salt = Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 9)
    ).join('');
    const rawSign = appId + q + salt + key;
    const sign = crypto.createHash('md5').update(rawSign).digest('hex');
    const params = Object.entries({
      q: encodeURIComponent(q),
      from,
      to,
      appId,
      salt,
      sign,
    })
      .reduce((acc: string[], [key, value]) => {
        acc.push(`${key}=${value}`);
        return acc;
      }, [])
      .join('&');
    https
      .get(
        'https://fanyi-api.baidu.com/api/trans/vip/translate?' + params,
        (res) => {
          const { statusCode } = res;
          if (statusCode !== 200) {
            res.resume();
            reject(
              new Error('Request Failed.\n' + `Status Code: ${statusCode}`)
            );
            return;
          }

          res.setEncoding('utf8');
          let rawData = '';
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', () => {
            try {
              const parsedData = JSON.parse(rawData);
              resolve(parsedData);
            } catch (e) {
              reject(e);
            }
          });
        }
      )
      .on('error', (err) => {
        reject(err);
      });
  });
}
