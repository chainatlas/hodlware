(() => {
 const form=document.querySelector('#contact-form,#withdrawal-form');if(!form)return;
 const withdrawal=form.id==='withdrawal-form', prefix=withdrawal?'withdrawal':'contact';
 const status=document.getElementById(prefix+'-status'),availability=document.getElementById(prefix+'-availability'),button=form.querySelector('button[type="submit"]');
 let ready=false,busy=false,key=null,previous=null;
 fetch('/api/form-context',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{
  ready=data?.ready===true;button.disabled=!ready;
  if(ready)availability.textContent=withdrawal?'Du kannst deinen Vertrag oder einen Teil davon hier elektronisch widerrufen. Nach Eingang erhältst du eine Bestätigung per E-Mail.':'Du kannst uns hier eine Nachricht senden.';
 }).catch(()=>{});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!ready||busy||!form.reportValidity())return;
  const data=Object.fromEntries(new FormData(form));const content=JSON.stringify(data);
  if(content!==previous){key=crypto.randomUUID();previous=content;}
  busy=true;button.disabled=true;status.textContent='Wird übermittelt …';
  try{
   const response=await fetch(withdrawal?'/api/withdrawals':'/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,requestId:key})});
   const result=await response.json();if(!response.ok||result.received!==true)throw Error(result.error||'Die Übermittlung konnte nicht bestätigt werden.');
   status.textContent=result.message+' Referenz: '+result.id+' · Eingang: '+new Intl.DateTimeFormat('de-DE',{dateStyle:'long',timeStyle:'long',timeZone:'Europe/Berlin'}).format(new Date(result.receivedAt));
   form.reset();previous=null;key=null;
  }catch(error){status.textContent=error.message||'Übermittlung nicht bestätigt. Bitte erneut versuchen oder E-Mail bzw. Post nutzen.';}
  finally{busy=false;button.disabled=false;status.focus();}
 });
})();
