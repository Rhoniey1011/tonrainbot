const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');

class Nada {
    constructor() {
        this.headers = {
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "id-ID,id;q=0.9",
            "Referer": "https://tonrain.org/",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, seperti Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0",
            "Sec-Fetch-Dest": "kosong",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
        };
    }

    log(pesan) {
        console.log(`[*] ${pesan}`);
    }

    async tungguDenganHitunganMundur(detik) {
        for (let i = detik; i >= 0; i--) {
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`===== Menunggu ${i.toString().cyan} detik untuk melanjutkan =====`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('');
    }

    async dapatkanInfoPengguna(otorisasi) {
        const url = "https://tonrain.org/server/login";
        const headers = { ...this.headers, "Authorization": `tma ${otorisasi}` };
        return axios.get(url, { headers });
    }

    async klik(otorisasi, klik) {
        const url = `https://tonrain.org/server/clicks?clicks=${klik}`;
        const headers = { ...this.headers, "Authorization": `tma ${otorisasi}` };
        return axios.get(url, { headers });
    }

    async lakukanKlik(otorisasi, sisaKlik) {
        while (sisaKlik > 0) {
            try {
                const responsKlik = await this.klik(otorisasi, sisaKlik);
                const { remainingClicks: klikTersisaBaru, success } = responsKlik.data;

                if (success) {
                    this.log(`${'Klik berhasil'.green}`);
                    this.log(`${'Energi tersisa:'.magenta} ${klikTersisaBaru.toString().cyan}`);

                    if (klikTersisaBaru <= 10) {
                        this.log(`${'Energi rendah, ganti akun!'.yellow}`);
                        break;
                    }

                    sisaKlik = klikTersisaBaru;
                } else {
                    this.log(`${'Klik tidak berhasil'.red}`);
                    break;
                }
            } catch (error) {
                console.log(`${'Kesalahan saat melakukan klik:'.red} ${error.message}`);
                break;
            }
        }
    }

    async utama() {
        const fileData = path.join(__dirname, 'data.txt');
        const data = fs.readFileSync(fileData, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);
        while (true) {
            for (let no = 0; no < data.length; no++) {
                const otorisasi = data[no];

                try {
                    const responsInfoPengguna = await this.dapatkanInfoPengguna(otorisasi);
                    const { username, balance, remainingClicks, clicksPerTap, limitEnergy } = responsInfoPengguna.data.userData;

                    const saldoTerformat = (parseFloat(balance) / 1000000000).toFixed(6);

                    console.log(`========== Akun ${(no + 1).toString().cyan} | ${username.green} ==========`);
                    this.log(`${'Saldo:'.magenta} ${saldoTerformat.toString().cyan}`);
                    this.log(`${'Klik per Tap:'.magenta} ${clicksPerTap.toString().cyan}`);
                    this.log(`${'Energi:'.magenta} ${remainingClicks.toString().cyan} / ${limitEnergy.toString().cyan}`);

                    await this.lakukanKlik(otorisasi, remainingClicks);

                } catch (error) {
                    console.log(`${'=========='.yellow} Akun ${(no + 1).toString().cyan} | ${'Kesalahan'.red} ${'=========='.yellow}`);
                    if (error.response) {
                        console.log(`${'Status:'.red} ${error.response.status}`);
                        console.log(`${'Pesan:'.red} ${JSON.stringify(error.response.data)}`);
                    } else if (error.request) {
                        console.log('Tidak ada respons dari server'.red);
                    } else {
                        console.log(`${'Kesalahan:'.red} ${error.message}`);
                    }
                    console.log(`${'Otorisasi:'.red} ${otorisasi}`);
                }
            }
            await this.tungguDenganHitunganMundur(60);
        }

    }
}

if (require.main === module) {
    const nada = new Nada();
    nada.utama().catch(err => {
        console.error(err.toString().red);
        process.exit(1);
    });
}
