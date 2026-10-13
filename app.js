const data=window.Q4_DATA;
const groups={'快银':{color:'#54b3c5',bg:'#def4f7'},'青龙':{color:'#49b899',bg:'#def4eb'},'星辰':{color:'#a4b957',bg:'#eef4da'},'玄武':{color:'#d590ad',bg:'#f7e5ec'},'游戏发行':{color:'#7199d5',bg:'#e3ecfa'},'快银-游戏自研':{color:'#c79a42',bg:'#fff0cd'},'涛哥需求':{color:'#aa93c9',bg:'#eee7f8'},'TOPONE':{color:'#2798d7',bg:'#e2f3fc'},'设计中心':{color:'#839866',bg:'#eef2e4'}};
const state={view:location.hash==='#people'?'people':location.hash==='#new'?'new':'pool',peopleMode:'months',group:'',month:'',person:'',status:'',query:''};
const storageKey='design-q4-2026-assignments-v2';let assignments={};let storageOK=true;
try{assignments=JSON.parse(localStorage.getItem(storageKey)||'{}');if(!assignments||typeof assignments!=='object')assignments={};for(const k in assignments){if(assignments[k]==='一帆')assignments[k]='周澳';if(assignments[k]==='绮铧')assignments[k]='琦铧';if(assignments[k]!==''&&!data.designers.includes(assignments[k]))delete assignments[k];}}catch{assignments={};storageOK=false;}
for(const key of ['N8-A','N8-B']){if(!Object.hasOwn(assignments,key)&&Object.hasOwn(assignments,'N8'))assignments[key]=assignments.N8;}
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bucketFor=r=>data.buckets.find(b=>b.taskIds.includes(r.id));
function owner(r){const bucket=bucketFor(r);return bucket?(Object.hasOwn(assignments,bucket.id)?assignments[bucket.id]:bucket.defaultOwner||''):r.owner;}
const projectFor=r=>data.newProjects.find(p=>p.taskIds.includes(r.id));
const projectRows=p=>p.taskIds.map(id=>data.rows.find(r=>r.id===id));
const projectOwners=p=>[...new Set(projectRows(p).map(owner).filter(Boolean))].join('、');
function category(r){if(r.supportOnly)return'known';if(r.decision==='已完成留档')return'done';if(bucketFor(r)&&!owner(r))return'new';if(owner(r))return'known';return'check';}
function filtered(){return data.rows.filter(r=>{
 const project=state.view==='new'?projectFor(r):null;const months=project?.months||r.months;
 const needle=state.query.toLocaleLowerCase().trim();const text=[r.product,r.demand,r.owner,r.support,r.note,r.id,owner(r),...(r.aliases||[]),project?.title||''].join(' ').toLocaleLowerCase();
 return (!state.group||r.group===state.group)&&(!needle||text.includes(needle))&&(!state.month||(state.month==='unknown'?!months.length:months.includes(Number(state.month))))&&(!state.person||(owner(r)+' '+r.support).includes(state.person))&&(!state.status||category(r)===state.status);
});}
function groupLabel(g){return `<span class="group-label"><span class="dot" style="background:${groups[g].color}"></span>${esc(g)}</span>`;}
function badge(r){const c=category(r);return `<span class="badge ${c==='new'?'pending':c}">${{done:'源记录已完成',new:'待你分配',known:bucketFor(r)?(Object.hasOwn(assignments,bucketFor(r).id)?'已分配 · 本机':'已分配'):r.decision==='用户确认'?'已确认':'原人优先',check:'待核对'}[c]}</span>`;}
function table(rows){return `<div class="table-wrap"><table><thead><tr><th>项目组</th><th>产品 / 项目</th><th>本阶段需求</th><th>时间</th><th>优先跟进</th><th>分配状态</th><th></th></tr></thead><tbody>${rows.map(r=>`<tr><td>${groupLabel(r.group)}</td><td><button class="product" data-task="${r.id}">${esc(r.product)}<span class="subtext">${r.id}${r.aliases?' · '+esc(r.aliases.join(' / ')):''}</span></button></td><td class="demand">${esc(r.demand)}</td><td class="cell-time">${esc(r.time)}${r.id==='X14'?'<span class="subtext">12月启动 · 跨季度提审</span>':''}</td><td class="owner">${r.id==='Q09'||r.id==='S02'?'<span class="badge confirmed">确认</span>':''}${esc(owner(r)||'—')}</td><td>${badge(r)}</td><td><button class="text-button row-arrow" data-task="${r.id}" aria-label="查看${esc(r.product)}详情">↗</button></td></tr>`).join('')}</tbody></table></div>`;}
function participants(r){return data.designers.filter(p=>owner(r).includes(p)||r.support.includes(p));}
function contribution(r,p){if(owner(r).includes(p))return r.primaryRoles?.[p]||'主跟进';const part=r.support.split(/[；;]/).find(s=>s.trim().startsWith(p+'：'));return part?part.trim().slice(p.length+1):'协作支持';}
function personDemand(r,p){return r.personDemands?.[p]||r.demand;}
function partners(r,p){if(r.aggregate)return `<span class="partner-line">${r.aggregate.length} ${r.aggregateType==='gp'?'项产品协助':'个版本阶段'} · 点击展开详情</span>`;const names=participants(r).filter(n=>n!==p);return names.length?`<span class="partner-line">与 ${names.map(n=>esc(n)+'（'+esc(contribution(r,n))+'）').join('、')} 一起</span>`:'';}
function collaborationBoard(rows){
 const shared=rows.filter(r=>participants(r).length>1);
 if(!shared.length)return '<div class="empty"><strong>当前筛选下暂无多人协作事项</strong><p>尝试切换月份、人员或项目组。</p></div>';
 const people=data.designers.filter(p=>shared.some(r=>participants(r).includes(p)));
 const monthKeys=state.month?[state.month==='unknown'?'unknown':Number(state.month)]:[10,11,12,'unknown'];
 return `<div class="collab-scroll"><div class="collab-board" style="--person-count:${people.length};min-width:${220+people.length*125}px"><div class="collab-header"><strong>项目 / 阶段</strong>${people.map(p=>`<div class="collab-person ${state.person===p?'selected':''}"><span class="avatar">${esc(p.slice(-1))}</span><strong>${esc(p)}</strong></div>`).join('')}</div>${monthKeys.map(m=>{const rs=shared.filter(r=>m==='unknown'?!r.months.length:r.months.includes(m)).sort((a,b)=>Object.keys(groups).indexOf(a.group)-Object.keys(groups).indexOf(b.group));if(!rs.length)return'';return `<section><h3 class="collab-month">${m==='unknown'?'时间待定':m+'月'}<span>${rs.length} 条多人协作事项</span></h3>${rs.map(r=>{const ps=participants(r),indices=ps.map(p=>people.indexOf(p)),first=Math.min(...indices),last=Math.max(...indices);return `<div class="collab-row"><button class="collab-project" data-task="${r.id}">${groupLabel(r.group)}<strong>${esc(r.product)}</strong><span>${esc(r.demand)}</span><small>${esc(r.time)} · ${r.id}</small></button><div class="collab-lanes" style="--task-bg:${groups[r.group].bg};--task-color:${groups[r.group].color}"><span class="collab-line" style="left:calc((100% / ${people.length}) * ${first+.5});width:calc((100% / ${people.length}) * ${last-first})" aria-hidden="true"></span>${people.map(p=>{const involved=ps.includes(p),primary=owner(r).includes(p);return `<div class="collab-lane ${state.person===p?'selected':''}">${involved?`<button class="collab-node ${primary?'':'is-support'}" data-task="${r.id}" aria-label="${esc(p+' · '+r.product+' · '+r.demand+' · '+(primary?'主跟进':'协作'))}"><strong>${esc(p)}</strong><small>${esc(contribution(r,p))}</small></button>`:''}</div>`;}).join('')}</div></div>`;}).join('')}</section>`;}).join('')}</div></div>`;
}
let groupedTasks=new Map();
function foldPersonTasks(items,p){
 const bins=new Map();
 for(const r of items){const gp=r.personalGroup?.person===p;const b=bucketFor(r);const key=gp?'GP-JIN':b?.id==='N6'&&owner(r).includes(p)?'XUANWU-STAGES':r.id;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(r);}
 return Array.from(bins,([key,rs])=>{
  const isGP=key==='GP-JIN';const isStages=key==='XUANWU-STAGES';if(!isGP&&(!isStages||rs.length===1))return rs[0];
  const r={...rs[0],id:'group-'+key+'-'+p,product:isGP?'GP协助':'新产品待定',demand:isGP?'多产品协同支持':`${rs.length} 个版本阶段`,owner:isGP?'':owner(rs[0]),support:isGP?'锦淳：GP协助':rs[0].support,months:[...new Set(rs.flatMap(x=>x.months))],time:isGP?'10月':'12月 · 末阶段次年1月提审',aggregate:rs,aggregateType:isGP?'gp':'stages'};
  groupedTasks.set(r.id,r);return r;
 });
}
function showGroupedDetail(r){
 $('#detail-id').textContent='Q4 / '+(r.aggregateType==='gp'?'GP协助':'版本阶段');
 $('#detail-body').innerHTML=groupLabel(r.group)+`<h2>${esc(r.product)}</h2><p class="detail-demand">${r.aggregateType==='gp'?'锦淳 · GP协助':esc(owner(r))+' · 主跟进'}</p><p class="detail-note">${r.aggregateType==='gp'?'人员分工合并展示，以下产品需求与原有负责人继续保留。':'按同一待定产品需求组合并展示，以下为版本阶段，不作为多个独立项目计数；最终产品数量仍待确认。'}</p><div class="grouped-detail-list">${r.aggregate.map(x=>`<button data-task="${x.id}"><strong>${esc(r.aggregateType==='gp'?x.product:x.demand)}</strong><span>${esc(r.aggregateType==='gp'?x.demand:x.product)}</span><small>${esc(x.time)}${x.id==='X14'?' · 12月启动，跨季度提审':''}</small><small>主跟进：${esc(owner(x)||'待核对 / 待分配')}${x.support?' · '+esc(x.support):''}</small><em>查看原始需求 ↗</em></button>`).join('')}</div>`;
 if(!$('#detail').open)$('#detail').showModal();
}
function personCards(rows){
 groupedTasks=new Map();
 const months=state.month&&state.month!=='unknown'?[Number(state.month)]:[10,11,12];
 const visibleMonths=state.month==='unknown'?[]:months;
 const showUnknown=!state.month||state.month==='unknown';
 const people=data.designers.filter(p=>!state.person||state.person===p).map(p=>{const raw=rows.filter(r=>owner(r).includes(p)||r.support.includes(p));return {name:p,raw,items:foldPersonTasks(raw,p)};}).filter(p=>p.items.length);
 const role=(r,p)=>owner(r).includes(p)?'主跟进':'协作';
 const label=r=>r.time.replace(/^(UI|计划|交付)：/,'');
 const chip=(r,p)=>`<button class="month-task ${role(r,p)==='协作'?'is-support':''}" data-task="${r.id}" style="--task-bg:${groups[r.group].bg};--task-color:${groups[r.group].color}" title="${esc(personDemand(r,p))}"><strong>${esc(r.product)}</strong><span>${esc(personDemand(r,p))}</span>${r.primaryRoles?.[p]?`<small>${esc(contribution(r,p))}</small>`:''}<small>${esc(label(r))}${r.months.length>1?' · 跨月事项':''}${category(r)==='done'?' · 源记录已完成':''}</small>${partners(r,p)}</button>`;
 const buckets=(rs,p)=>['主跟进','协作'].map(kind=>{const tasks=rs.filter(r=>role(r,p)===kind);return tasks.length?`<div class="month-role">${kind}<span>${tasks.length}</span></div>${tasks.map(r=>chip(r,p)).join('')}`:''}).join('');
 const cards=state.peopleMode==='connections'?collaborationBoard(rows):people.map(({name:p,items,raw})=>{
 const own=items.filter(r=>owner(r).includes(p)).length;
 const header=`<div class="person-top"><span class="avatar">${esc(p.slice(-1))}</span><h3>${esc(p)}</h3><span>主跟进 ${own} · 协作 ${items.length-own}<b>${items.length} 项分工${items.length!==raw.length?' · '+raw.length+' 条原始事项':''}</b></span></div>`;
 if(state.peopleMode==='months'){
 const columns=[...visibleMonths.map(m=>({title:m+'月',items:items.filter(r=>r.months.includes(m))})),...(showUnknown?[{title:'时间待定',items:items.filter(r=>!r.months.length)}]:[])];
 return `<article class="person-schedule">${header}<div class="month-columns" style="--columns:${columns.length}">${columns.map(c=>`<section class="month-column"><h4>${c.title}<span>${c.items.length} 项</span></h4>${c.items.length?buckets(c.items,p):'<p class="no-task">暂无已收集事项</p>'}</section>`).join('')}</div></article>`;
 }
 const scheduled=items.filter(r=>r.months.length).sort((a,b)=>Object.keys(groups).indexOf(a.group)-Object.keys(groups).indexOf(b.group)||Math.min(...a.months)-Math.min(...b.months));
 const gantt=visibleMonths.length?`<div class="gantt-scroll"><div class="gantt" style="--months:${visibleMonths.length}"><div class="gantt-head"><span>项目 / 本阶段需求</span><div class="gantt-axis">${visibleMonths.map(m=>`<strong>${m}月</strong>`).join('')}</div></div>${scheduled.length?scheduled.map(r=>{const active=visibleMonths.map((m,i)=>r.months.includes(m)?i:-1).filter(i=>i>=0);if(!active.length)return'';return `<div class="gantt-row"><button class="gantt-label" data-task="${r.id}"><span><i class="dot" style="background:${groups[r.group].color}"></i><strong>${esc(r.product)}</strong><em>${esc(contribution(r,p))}</em></span><small>${esc(personDemand(r,p))}</small><small class="gantt-date">${esc(r.time)}</small>${partners(r,p)}</button><div class="gantt-track">${visibleMonths.map((m,i)=>`<span class="gantt-cell" style="grid-column:${i+1}"></span>`).join('')}<button class="gantt-bar ${role(r,p)==='协作'?'is-support':''}" data-task="${r.id}" style="--task-bg:${groups[r.group].bg};--task-color:${groups[r.group].color};grid-column:${active[0]+1} / ${active[active.length-1]+2}" aria-label="${esc(p+' · '+r.product+' · '+r.demand+' · '+r.time+' · '+role(r,p))}">${esc(label(r))}${r.months.length>1?' · 跨月':''}${r.id==='X14'?' · → 1月提审':''}</button></div></div>`;}).join(''):'<p class="no-task gantt-empty">暂无已明确月份的事项</p>'}</div></div>`:'';
 const unknown=items.filter(r=>!r.months.length);
 return `<article class="person-schedule">${header}${gantt}${showUnknown?`<section class="unscheduled"><h4>时间待定 <span>${unknown.length} 项</span></h4><div class="unscheduled-tasks">${unknown.length?unknown.map(r=>`<div><span class="month-role">${role(r,p)}</span>${chip(r,p)}</div>`).join(''):'<p class="no-task">暂无时间待定事项</p>'}</div></section>`:''}</article>`;
 }).join('');
 const unassigned=rows.filter(r=>!owner(r)&&!r.supportOnly).length;
 return `<div class="schedule-toolbar"><div class="schedule-switch" role="group" aria-label="人员分工呈现方式"><button data-people-mode="months" aria-pressed="${state.peopleMode==='months'}">按月份</button><button data-people-mode="gantt" aria-pressed="${state.peopleMode==='gantt'}">甘特图</button><button data-people-mode="connections" aria-pressed="${state.peopleMode==='connections'}">协作连线</button></div><span>${state.peopleMode==='months'?'每人按月展开 · 卡片标明搭档':state.peopleMode==='connections'?'同一行 = 同一项目阶段 · 连线展示共同参与人':'色块表示涉及月份，非精确工期 · 虚线为协作'}</span></div><div class="schedule-legend">${Object.keys(groups).map(groupLabel).join('')}</div><div class="schedule-note">保留原时间口径（UI计划 / 交付 / 提审）；未明确月份的事项单列。跨月与多人协作事项只计一次，不按出现次数累加。${unassigned?`当前有 ${unassigned} 条未确定主负责人，可在需求池核对。`:''}</div>${cards||'<div class="empty"><strong>当前筛选下暂无人员分工</strong><p>尚未分配的项目可在「新项目总览」中指定设计师。</p><button class="secondary" data-view="new">前往分配</button></div>'}`;
}
function newCards(rows){
 const projects=data.newProjects.filter(p=>rows.some(r=>p.taskIds.includes(r.id)));
 const assigned=projects.filter(p=>projectOwners(p)).length;
 const card=p=>{
  const rs=projectRows(p),lead=projectOwners(p),bucket=bucketFor(rs[0]);
  const support=[...new Set(rs.map(r=>r.support).filter(Boolean))].join('；');
  return `<article class="new-card project-card" style="--color:${groups[p.group].color};--project-bg:${groups[p.group].bg}"><div class="project-card-top">${groupLabel(p.group)}<span class="badge ${lead?'known':'pending'}">${lead?'已分配':'待分配'}</span></div><h3>${esc(p.title)}</h3><div class="project-months" aria-label="涉及月份">${[10,11,12].map(m=>`<span class="${p.months.includes(m)?'active':''}">${m}月</span>`).join('')}${!p.months.length?'<small>月份待定</small>':''}</div>${p.note?`<p class="project-note">${esc(p.note)}</p>`:''}<div class="project-stages">${rs.map(r=>`<button data-task="${r.id}"><span>${esc(r.time)}</span><strong>${esc(r.demand)}</strong><i aria-hidden="true">↗</i></button>`).join('')}</div><div class="project-assignee"><span>主跟进</span>${bucket?`<label class="sr-only" for="assign-${bucket.id}">${esc(p.title)}负责人</label><select id="assign-${bucket.id}" data-assign="${bucket.id}"><option value="" ${!lead?'selected':''}>待分配</option>${data.designers.map(n=>`<option value="${esc(n)}" ${lead===n?'selected':''}>${esc(n)}</option>`).join('')}</select>`:`<strong>${esc(lead||'待分配')}</strong>`}${support?`<small>协助：${esc(support)}</small>`:''}${rs[0].primaryRoles?`<small>${Object.entries(rs[0].primaryRoles).map(([n,role])=>esc(n)+'：'+esc(role)).join('；')}</small>`:''}</div></article>`;
 };
 return `<div class="project-overview-count"><span><b>${projects.length}</b> 项新项目</span><span><b>${assigned}</b> 已分配</span><span><b>${projects.length-assigned}</b> 待分配</span><small>一个项目一张卡 · 同项目各版本集中展示</small></div>${[10,11,12,'unknown'].map(m=>{const ps=projects.filter(p=>(p.months.length?Math.min(...p.months):'unknown')===m);return ps.length?`<section class="project-period"><h2>${m==='unknown'?'Q4 · 月份待定':m+'月起'}<span>${ps.length} 项</span></h2><div class="new-grid">${ps.map(card).join('')}</div></section>`:'';}).join('')}<p class="assignment-footnote">${storageOK?'下拉调整保存在当前浏览器，可导出 CSV 留存。':'当前浏览器无法保存调整，请导出 CSV 留存。'}</p>`;
}
function render(){
 const rows=filtered();$('.stats>div:nth-child(2) strong').innerHTML=Object.keys(groups).length+'<small>组</small>';$('.stats>div:first-child strong').innerHTML=data.rows.length+'<small>条</small>';const headings={pool:['把这个季度，安排清楚。','项目需求、原有分工和待定事项，集中在同一处。'],people:['每个人，每个月，一目了然。','按 10—12 月查看人员分工，也可以切换甘特图查看跨月安排。'],new:['Q4 新项目总览','10—12月新项目，已分配与待分配一起看。']};
 $('#view-title').textContent=headings[state.view][0];$('#view-description').textContent=headings[state.view][1];
 $('.views').querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b.dataset.view===state.view);b.setAttribute('aria-current',b.dataset.view===state.view?'page':'false');});
 $('#groups').innerHTML=[['','全部项目组'],...Object.keys(groups).map(g=>[g,g])].map(([g,label])=>`<button data-group="${esc(g)}" class="${state.group===g?'active':''}" aria-pressed="${state.group===g}"><span class="dot" style="background:${g?groups[g].color:'#b8d0ab'}"></span>${label}<em>${g?data.rows.filter(r=>r.group===g).length:data.rows.length}</em></button>`).join('');
 $('#scope').textContent=state.group||'全部项目组';
 const pending=data.newProjects.filter(p=>!projectOwners(p)).length;$('#new-count').innerHTML=pending+'<small>项</small>';
 const newRows=rows.filter(r=>projectFor(r));$('#result-count').textContent=state.view==='new'?`${new Set(newRows.map(r=>projectFor(r).id)).size} / ${data.newProjects.length} 项新项目`:`${rows.length} / ${data.rows.length} 条阶段事项`;
 $('#view-hint').textContent=state.view==='people'?'按人员 × 月份呈现；点击任务可查看原始时间和需求。':state.view==='new'?'覆盖新包、首发与新产品规划；已有产品迭代在需求池查看。':'按阶段记录，不等于独立项目数。点击任务查看详情。';
 let html=state.view==='pool'?table(rows):state.view==='people'?personCards(rows):newCards(rows);
 const empty=!rows.length||(state.view==='new'&&!newRows.length);
 if(empty)html='<div class="empty"><span>⌕</span><strong>没有符合条件的事项</strong><p>试试其他关键词，或重置筛选条件。</p><button class="secondary" data-reset>重置筛选</button></div>';
 $('#content').innerHTML=html;
}
function showDetail(id){if(groupedTasks.has(id)){showGroupedDetail(groupedTasks.get(id));return;}const r=data.rows.find(r=>r.id===id);if(!r)return;$('#detail-id').textContent='Q4 / '+r.id;const fields=[['时间',r.time],['开发启动',r.dev],['优先跟进',owner(r)||(r.supportOnly?'按各产品原负责人':'待核对 / 待你分配')],...(r.primaryRoles?[['共同负责分工',Object.entries(r.primaryRoles).map(([p,role])=>p+'：'+role).join('；')]]:[]),['协作支持',r.support||'未指定'],['分配口径',bucketFor(r)?owner(r)?(Object.hasOwn(assignments,bucketFor(r).id)?'本机分配':'已分配'):'新项目待你分配':r.decision],['设计量',r.size],['源进度',r.status],['需求来源',r.source],['分工依据',r.basis||'暂未匹配到明确历史主责']];$('#detail-body').innerHTML=groupLabel(r.group)+`<h2>${esc(r.product)}</h2>${r.aliases?'<p class="subtext">关联名称：'+esc(r.aliases.join(' / '))+'</p>':''}<p class="detail-demand">${esc(r.demand)}</p>${badge(r)}<dl>${fields.map(([k,v])=>`<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>${r.note?`<div class="detail-note">${esc(r.note)}</div>`:''}`;if(!$('#detail').open)$('#detail').showModal();}
function reset(){Object.assign(state,{group:'',month:'',person:'',status:'',query:''});$('#search').value='';['month','person','state'].forEach(id=>$('#'+id).value='');render();}
function notify(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2500);}
function csvCell(value){let s=String(value??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
function exportCSV(){let rows=filtered();if(state.view==='new'){const ids=new Set(data.newProjects.filter(p=>rows.some(r=>p.taskIds.includes(r.id))).flatMap(p=>p.taskIds));rows=data.rows.filter(r=>ids.has(r.id));}const cols=['编号','项目组','产品','需求','时间','优先跟进','协作支持','分配口径','设计量','源进度','注意事项','开发启动','需求来源','历史依据'];const csv='\uFEFF'+[cols,...rows.map(r=>[r.id,r.group,r.product,r.demand,r.time,owner(r)||'待分配/核对',r.support,bucketFor(r)&&owner(r)?(Object.hasOwn(assignments,bucketFor(r).id)?'本机已分配':'已分配'):r.decision,r.size,r.status,r.note,r.dev,r.source,r.basis])].map(r=>r.map(csvCell).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='2026-Q4-需求池.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify(`已导出 ${rows.length} 条需求`);}
$('#person').innerHTML+=[...data.designers].map(p=>`<option>${esc(p)}</option>`).join('');
document.addEventListener('click',e=>{const t=e.target.closest('[data-task],[data-view],[data-group],[data-reset],[data-people-mode]');if(!t)return;if(t.hasAttribute('data-people-mode')){state.peopleMode=t.dataset.peopleMode;render();}else if(t.hasAttribute('data-task'))showDetail(t.dataset.task);else if(t.hasAttribute('data-view')){state.view=t.dataset.view;history.replaceState(null,'',state.view==='people'?'#people':state.view==='new'?'#new':location.pathname);render();}else if(t.hasAttribute('data-group')){state.group=t.dataset.group;render();}else reset();});
$('#search').addEventListener('input',e=>{state.query=e.target.value;render();});
for(const [id,key]of [['month','month'],['person','person'],['state','status']])$('#'+id).addEventListener('change',e=>{state[key]=e.target.value;render();});
document.addEventListener('change',e=>{if(!e.target.matches('[data-assign]'))return;const id=e.target.dataset.assign;assignments[id]=e.target.value;try{localStorage.setItem(storageKey,JSON.stringify(assignments));storageOK=true;}catch{storageOK=false;}render();notify(storageOK?'分配已保存在当前浏览器':'分配暂存于本次页面，请导出留存');});
$('#reset').addEventListener('click',reset);$('#export').addEventListener('click',exportCSV);$('#close-detail').addEventListener('click',()=>$('#detail').close());$('#detail').addEventListener('click',e=>{if(e.target===$('#detail')&&e.clientX<e.target.getBoundingClientRect().left)e.target.close();});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)&&!$('#detail').open){e.preventDefault();$('#search').focus();}});
render();
