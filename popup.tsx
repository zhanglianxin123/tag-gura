import React, { useEffect, useState } from 'react';

function IndexPopup() {
//   const sync = require('sync');
// const fs = require('fs');
// const tabs = sync.Wait(chrome.tabs.query({}))
const t =chrome.runtime.getURL('tabs/tab_manage.html')

useEffect(() => {
  async function getData() {
    const t =chrome.runtime.getURL('tabs/tab_manage.html')
    const tabs = await chrome.tabs.query({});
    var urls = '';
    var flag = false
    var id;
    tabs.map(
      (tab) =>{
        urls = urls+tab.url
        console.log("url:"+tab.url)
        if (tab.url == t){
          id = tab.id
          flag = true
          
        }
      }
    )
    if (flag) {
      await chrome.tabs.update(id,{active:true})
      return 
    }
    // return <p>{urls}</p>

   
    const new_tab= chrome.tabs.create({url: t,active: true,pinned: true})

  }

  getData();
}, []);

  return (<div>
    <a href={t} target="_blank">to</a>
    </div>
  )
}

export default IndexPopup
