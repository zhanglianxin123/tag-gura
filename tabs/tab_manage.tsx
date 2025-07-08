import { Button, Dropdown, Input, Layout, List, Modal, Space, Switch, Image, type MenuProps } from "antd";
import { Content, Header } from "antd/es/layout/layout";

import React, { useEffect, useState, useRef } from 'react';
import { Storage } from "@plasmohq/storage"
import { CloseOutlined, DownOutlined, EditOutlined } from '@ant-design/icons';
function DeltaFlyerPage() {
  // 创建一个名为 parentState 的状态变量，并初始化为空对象
  const storage = new Storage({ area: "local" })
  const [data, setData] = useState(null);
  const [time_value, setTimeValue] = useState(10);
  const [input_value, setInputValue] = useState(10);
  const [level_value, setLevelValue] = useState("分钟");
  const [input_level, setInputLevel] = useState("分钟");
  const [switch_value, setSwitchValue] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef();
  const [open, setOpen] = useState(false);
  const [onMouseId, setOnMouseId] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [tabsLassTime, setTabsLassTime] = useState({});
  const getTime = (value, level) => {
    // value是否为字符
    if (typeof value === 'string') {
      value = parseInt(value, 10);
    }

    if (level === '分钟') {
      return value;
    } else if (level === '小时') {
      return value * 60;
    } else if (level === '天') {
      return value * 24 * 60;
    } else {
      return 10;
    }
  }
  useEffect(() => {
    async function getData() {
      try {
        const tabs = await chrome.tabs.query({});
        setData(tabs);
        // store获取数据
        const time_value = await storage.get('time_value')
        const level_value = await storage.get('level_value')
        setTimeValue(parseInt(time_value, 10) || 10);
        setInputValue(parseInt(time_value, 10) || 10);
        setLevelValue(level_value || "分钟");
        setInputLevel(level_value || "分钟");
        
        const switch_value = await storage.get('switch_value')
        console.log(switch_value);
        setSwitchValue(switch_value === 'true');
        setTabsLassTime(await storage.get('tabsLassTime')||{})
        console.log("switch_value", switch_value)
        if (switch_value === 'true') {
          intervalRef.current = handleInterval(getTime(time_value, level_value));
        }
        setIsLoading(false);
        console.log(switch_value);
      } catch (error) {
        console.error('Error:', error)
      }
    }
    getData();
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      var tabsLassTime = await storage.get('tabsLassTime')||{};
      var nowTime= new Date().getTime();
      var id = activeInfo.tabId;
      tabsLassTime[id] = nowTime+'';
      await storage.set('tabsLassTime', tabsLassTime);
      setTabsLassTime(tabsLassTime);
      
      console.log("tabsLassTimet+"+JSON.stringify(tabsLassTime));

    });
    chrome.tabs.onRemoved.addListener(async (tabId) => {
      var tabsLassTime = await storage.get('tabsLassTime')||{};
      delete tabsLassTime[tabId];
      await storage.set('tabsLassTime', tabsLassTime);
      setTabsLassTime(tabsLassTime);
    });

    window.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    
  }, []);
  // 执行定时
  const handleInterval = (time) => {
    if (intervalRef.current) {
      console.log('定时器已存在，取消上一次定时器');
      clearInterval(intervalRef.current);
    }
    console.log('开启定时器');
    // 当前时间 格式化
    console.log(new Date());
    console.log(time);
    return setInterval(async () => {
      console.log('每隔' + time + '分钟执行的代码');
      if (data !== null) {
        var newData =await chrome.tabs.query({})
        setData(newData);
        newData.forEach(async item => {
          if (item.discarded !== true && item.title !== undefined && item.active !== true) {
            // 当前时间和item.lastAccessed的时间差
            var lastAccessed = item.lastAccessed;
            if (item.lastAccessed === undefined) {
              if(tabsLassTime[item.id]!== undefined){
              lastAccessed = tabsLassTime[item.id];
              }else{
                lastAccessed = new Date().getTime();
                // 没有数据设置当前时间为lastAccessed
                var newTabLassTime = tabsLassTime;
                newTabLassTime[item.id] = lastAccessed+'';
                await storage.set('tabsLassTime', newTabLassTime);
                setTabsLassTime(newTabLassTime);
              }
            }
            const timeDiff = Math.abs(Date.now() - item.lastAccessed);
            // 如果时间差大于60秒，则认为该标签已经不活跃，则关闭标签
            // console.log(timeDiff);
            if (timeDiff > time * 60 * 1000) {
              chrome.tabs.discard(item.id, (isDiscarded) => {
                console.log("闲置标签");
                console.log(isDiscarded);
              });
              var newData = data.map(tab => {
                if (tab.id === item.id) {
                  tab.discarded = true;
                }
                return tab;
              });
              setData(newData);
            }
          }
        });
      }
      // 这里可以放置你想要每隔19秒执行的代码
    }, time * 60 * 1000);
  }

  async function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // 页面变为可见状态
      const tabs = await chrome.tabs.query({});
      setData(tabs);
    } else {

    }
  }
  // console.log(222);
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!data) {
    return <div>No data found</div>;
  }
  const items: MenuProps['items'] = [
    {
      key: '1',
      label:
        '分钟'
      ,
    },
    {
      key: '2',
      label:
        '小时'
      ,
    },
    {
      key: '3',
      label:
        '天'
      ,
    },
  ];
  const onClick: MenuProps['onClick'] = ({ key }) => {
    if (key === '1') {
      setInputLevel('分钟');
    } else if (key === '2') {
      setInputLevel('小时');
    } else if (key === '3') {
      setInputLevel('天');
    } else {
      console.log('unknown key');
    }
  };
  var mapData = {}
  if (data !== null) {
    // 根据windowId分组
    data.forEach(item => {
      if (item.title === undefined) {
        return;
      }
      if (item.windowId in mapData) {
        mapData[item.windowId].push(item);
      } else {
        mapData[item.windowId] = [item];
      }
    })
  }
  console.log(mapData);
  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/*  */}
      <Header style={{
        padding: 0, backgroundColor: '#eff0ee',
        margin: ' 18px 16px',
        paddingLeft: 100,
        paddingRight: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',

      }}>
        <div style={{ width: 260 }}>
          <span>
            超过 <span style={{color: '#367bf6', fontSize: 18}}>{time_value} {level_value}</span> 闲置标签
          </span>
          <EditOutlined style={{ marginLeft: 10,color: '#b3b3ad' }} onClick={
            () => {
              setOpen(true);
            }
          } />
          <Modal
            title="修改时间"
            open={open}
            onOk={async () => {
              setConfirmLoading(true);
              // 如果开启了，则重新开启定时器
              if (switch_value) {
                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                }
                intervalRef.current = handleInterval(getTime(input_value, input_level));
              }
              console.log(input_value);
              console.log(input_level);
              // 存储数据
              await storage.set('time_value', input_value);
              await storage.set('level_value', input_level);
              setLevelValue(input_level);
              setTimeValue(parseInt(input_value, 10));

              setOpen(false);
              setConfirmLoading(false);
            }}
            confirmLoading={confirmLoading}
            onCancel={() => {
              setInputValue(time_value);
              setInputLevel(level_value);
              setOpen(false);
            }}
          >
            <div style={{ marginTop: 20, marginLeft: 20, marginBottom: 20 }}>
              <Input style={{ width: 100 }} defaultValue={time_value} onChange={(e) => {
                setInputValue(e.target.value);
              }} />
              <Dropdown menu={{ items, onClick }}>


                <Space style={{ marginLeft: 10 }}>
                  {input_level}
                  <DownOutlined />
                </Space>

              </Dropdown>
            </div>
          </Modal>
          <Switch  defaultChecked={switch_value} style={{ marginLeft: 10 }} checkedChildren="开启" unCheckedChildren="关闭" onChange={async (check) => {
            setSwitchValue(check);

            if (check) {///开启定时器
              await storage.set('switch_value', 'true');
              intervalRef.current = handleInterval(getTime(time_value, level_value));
            } else {
              await storage.set('switch_value', 'false');
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
            }
          }} />
        </div>

        <div >
          <Button  style={{
            backgroundColor: "#f5f5f5"
          }} onClick={() => {
            data.map(item => {
              if (item.discarded !== true && item.title !== undefined && item.active !== true) {
                chrome.tabs.discard(item.id, (isDiscarded) => {
                  console.log(isDiscarded);
                });
                item.discarded = true;

              }
              return item;
            })
            setData(data);
          }}><span style={{color:'#5c6c6c'}}>清理内存</span></Button>
        </div>


      </Header>
      <Content
        style={{
          margin: '24px 16px',
          paddingTop: 10,
          paddingLeft: 100,
          paddingRight: 100,
          minHeight: 280,

        }}
      >
        <div>
          {
            Object.keys(mapData).map(windowId => (
              <div key={windowId} style={{ marginTop: 10 }}>
                <List

                  bordered
                  dataSource={mapData[windowId]}
                  renderItem={(item) => (
                    <List.Item onMouseOver={() => {
                      // console.log(item.id)
                      setOnMouseId(item.id)
                    }} onMouseOut={() => {
                      setOnMouseId('')
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {/* 鼠标放组件上显示 close图标 */}
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {item.id === onMouseId ? <CloseOutlined style={{ marginRight: 14, cursor: 'pointer' }} onClick={() => {
                              chrome.tabs.remove(item.id);
                              var newData = data.filter(tab => tab.id !== item.id);
                              setData(newData);
                             }} /> : <div style={{ marginRight: 28 }}></div>}
                          </div>

                          <Image src={item.favIconUrl} width={16} height={16} />
                          <span style={{ marginLeft: 10 }} onClick={()=>{
                            chrome.tabs.update(item.id, {active: true});
                          }}>{item.title}</span> </div>{item.discarded !== true ?
                            <div style={{}}><Button style={{backgroundColor:'#f5f5f5'}} onClick={() => {
                              if (item.discarded !== true) {
                                chrome.tabs.discard(item.id, (isDiscarded) => {
                                  console.log(isDiscarded);
                                });
                                var newData = data.map(tab => {
                                  if (tab.id === item.id) {
                                    tab.discarded = true;
                                  }
                                  return tab;
                                });
                                setData(newData);

                              }
                            }}><span style={{color:'#5c5c5c'}}>闲置</span></Button></div> : <div></div>}
                      </div>
                    </List.Item>
                  )}
                /></div>))
          }

        </div>
      </Content>



    </Layout>
  );
}

export default DeltaFlyerPage