const { chromium } = require('playwright-core');
(async()=>{
 const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
 const pg=b.contexts()[0].pages().find(p=>p.url().includes('/host'));
 const cmd=process.argv[2];
 if(cmd==='shot') await pg.screenshot({path:'/workspace/party-games-retest/screenshots/'+process.argv[3]+'.png',fullPage:true});
 else if(cmd==='text') console.log(await pg.evaluate(()=>document.body.innerText));
 else if(cmd==='click'){ await pg.locator(`button:has-text("${process.argv[3]}")`).first().click(); console.log('ok'); }
 await b.close();
})().catch(e=>{console.error(e.message);process.exit(1)});
