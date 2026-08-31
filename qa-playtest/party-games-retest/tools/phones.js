const { chromium } = require('playwright-core');
const PORTS = [9324,9325,9326,9327];
async function pages(){
  const out=[];
  for (const p of PORTS){
    const b = await chromium.connectOverCDP('http://127.0.0.1:'+p);
    const ctx=b.contexts()[0]; const pg=ctx.pages().find(x=>x.url().includes('/play'))||ctx.pages()[0];
    out.push({b,pg,port:p});
  }
  return out;
}
async function main(){
  const cmd=process.argv[2];
  const ps=await pages();
  if(cmd==='shot'){
    const prefix=process.argv[3];
    for(const {pg,port} of ps){ await pg.screenshot({path:`/workspace/party-games-retest/screenshots/${prefix}-P${port-9323}.png`}); }
  } else if(cmd==='text'){
    for(const {pg,port} of ps){ const t=await pg.evaluate(()=>document.body.innerText); console.log('=== P'+(port-9323)+' ===\n'+t); }
  } else if(cmd==='click'){
    const idx=parseInt(process.argv[3]); const sel=process.argv[4];
    const {pg}=ps[idx-1];
    await pg.locator(sel).first().click();
    console.log('clicked');
  } else if(cmd==='fill'){
    const idx=parseInt(process.argv[3]);
    const {pg}=ps[idx-1];
    await pg.locator('input,textarea').first().fill(process.argv[4]);
    console.log('filled');
  }
  for(const {b} of ps) await b.close();
}
main().catch(e=>{console.error(e.message);process.exit(1)});
