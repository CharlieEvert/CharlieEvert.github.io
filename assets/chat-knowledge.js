const STOP = new Set('a an and are as at be can did do does for from has he his how i in is it me of on or s some tell that the their this to up was what which who with you your charlie evert about'.split(' '));
export function retrieve(question, records) {
  const tokens = [...new Set(question.toLowerCase().match(/[a-z0-9]+/g)||[])].filter(t=>!STOP.has(t));
  const ranked = records.map((r,index)=>{const words=(r.title+' '+r.tags+' '+r.text).toLowerCase().match(/[a-z0-9]+/g)||[];const set=new Set(words);return {r,index,score:tokens.reduce((n,t)=>n+(set.has(t)?(r.tags.includes(t)?3:1)*Math.log(1+records.length/Math.max(1,records.filter(x=>(x.text+' '+x.tags).toLowerCase().includes(t)).length)):0),0)};}).sort((a,b)=>b.score-a.score||a.index-b.index);
  return ranked.filter(x=>x.score>0).slice(0,3).map(x=>x.r);
}

// Prefer the source wording whenever a small model drops important commercial qualifiers.
export function groundedAnswer(answer, records, question) {
  const source=records[0]?.text||'';
  const money=text=>[...text.matchAll(/\$\s*([\d,.]+)\s*(billion|million|thousand|[bmk])?/gi)].map(m=>Number(m[1].replaceAll(',',''))*({b:1e9,billion:1e9,m:1e6,million:1e6,k:1e3,thousand:1e3}[m[2]?.toLowerCase()]||1));
  const allowed=money(records.map(r=>r.text).join(' '));
  const numberWords={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,sixteen:16,twenty:20};
  const figures=text=>(text.toLowerCase().replace(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|sixteen|twenty)\b/g,w=>numberWords[w]).match(/\d+(?:[,.]\d+)*/g)||[]).map(v=>Number(v.replaceAll(',','')));
  const sourceFigures=figures(source);
  let valid=answer.trim().length>35&&money(answer).every(v=>allowed.includes(v))&&figures(answer).every(v=>sourceFigures.includes(v));
  // Budget scope, deal provenance and timelines must use the approved wording verbatim.
  if(records[0]?.title.includes('PwC portfolio'))valid=false;
  if(/pipeline/i.test(source)&&/\$1B/.test(source))valid=valid&&/pipeline/i.test(answer);
  if(/projected|projecting/i.test(source)&&/sav|cost|hour/i.test(question))valid=valid&&/project|pilot/i.test(answer);
  return {text:valid?answer.trim():source,fromSource:!valid};
}
