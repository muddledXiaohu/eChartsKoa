const koa = require( 'koa')
const bodyParser= require('koa-bodyparser')
const app = new koa()
const router = require('koa-router')()
const DB = require('../db')
app.use(bodyParser());
const dataModule = require('../data');
// =====================================================

// 查询昨天
router.post("/aimYester", async (ctx) => {
    let Date_UTC = ctx.request.body.Date_UTC
    let VoyageId = ctx.request.body.VoyageId
    const data = await DB.find('aim', {Date_UTC, VoyageId})
    const lastData = data[data.length - 1] || {}
    const dt = {
        static: 200,
        data: lastData
    }
    ctx.body = JSON.stringify(dt);
})
// 查询昨天
router.post("/cllYesterday", async (ctx) => {
    let shipsId = ctx.request.body.shipsId
    const data = await DB.find('cllNewretown', {shipsId})
    const lastData = data[data.length - 1] || {}
    const dt = {
        static: 200,
        data: lastData
    }
    ctx.body = JSON.stringify(dt);
})

router.post("/aimYesterday", async (ctx) => {
    const data = await DB.find('aim', {})
    const lastData = data[data.length - 1] || {}
    const dt = {
        static: 200,
        data: lastData
    }
    ctx.body = JSON.stringify(dt);
})

// 查询前天
router.get("/cllNewretown/yesterday", async (ctx) => {
    const data = await DB.find('cllNewretown', {})
    const lastData = data[data.length - 2] || {}
    const dt = {
        static: 200,
        data: lastData
    }
    ctx.body = JSON.stringify(dt);
})
// 最后一次数据
router.post("/cllNewretown/last", async (ctx) => {
    let shipsId = ctx.request.body.shipsId
    const data = await DB.find('cllNewretown', {shipsId})
    const lastData = data[data.length - 1] || {}
    const dt = {
        static: 200,
        data: lastData
    }
    ctx.body = JSON.stringify(dt);
})

// 创建
router.post("/aim/create", async (ctx) => {
    let body = ctx.request.body
    const dataId = await DB.find('aim', {})
    const lastId = dataId.length != 0 ? dataId[dataId.length - 1].id + 1 : 1
    const params = {
        IMO:body.IMO,
        Date_UTC:body.Date_UTC,
        Time_UTC:body.Time_UTC,
        Voyage_From:body.Voyage_From,
        Voyage_To:body.Voyage_To,
        Latitude_Degree:body.Latitude_Degree,
        Latitude_Minutes:body.Latitude_Minutes,
        Latitude_North_South:body.Latitude_North_South,
        Longitude_Degree:body.Longitude_Degree,
        Longitude_Minutes:body.Longitude_Minutes,
        Longitude_East_West:body.Longitude_East_West,
        Event:body.Event,
        Time_Since_Previous_Report:body.Time_Since_Previous_Report,
        Time_Elapsed_Anchoring:body.Time_Elapsed_Anchoring,
        Distance:body.Distance,
        Cargo_Mt:body.Cargo_Mt,
        ME_Consumption_HFO:body.ME_Consumption_HFO,
        ME_Consumption_MGO:body.ME_Consumption_MGO,
        HFO_ROB:body.HFO_ROB,
        MGO_ROB:body.MGO_ROB,
        shopId:body.shopId,
        VoyageId:body.VoyageId,
        id:lastId
    }
    const calculationData = await calculationFnc(params, false)
    const data = await DB.insert('aim', params)
    let dt = {}
    if (data.result.ok === 1 &&calculationData.result.ok === 1) {
        await DB.find('shipNo', {id: body.VoyageId}).then(async(data) => {
            const datas = data[0] || {}
            await DB.update('shipNo', datas, {
                surplusvModelData:body.surplusvModelData
            })
        })
        dt = {
            start: 200,
            msg: '上传成功'
        }
    } else {
        console.log(data);
    }
    ctx.body = JSON.stringify(dt);
})

const calculationFnc = async(params, news) => {
    const calculation = await DB.find('calculation', {shopId: params.shopId})
    const calculationId = calculation.length != 0 ? calculation[calculation.length - 1].id + 1 : 1
    let calculationArr = {
        Date_UTC: params.Date_UTC,
        Distance: params.Distance,
        CumulativeDistance: params.Distance+(calculation[calculation.length - 1]?.CumulativeDistance||0),
        ME_Consumption: params.ME_Consumption_HFO+params.ME_Consumption_MGO,
        CumulativeME_Consumption: params.ME_Consumption_HFO+params.ME_Consumption_MGO+(calculation[calculation.length - 1]?.CumulativeME_Consumption||0),
        id: calculationId,
        IMO:params.IMO,
        shopId: params.shopId,
        Voyage_To: params.Voyage_To,
        VoyageId:params.VoyageId,
    }
    calculationArr.M = (calculationArr.CumulativeME_Consumption || 0) * 3.114 * 1000 * 1000
    calculationArr.W = 318689 * (calculationArr.CumulativeDistance || 0)
    calculationArr.AttainedCII = calculationArr.M / calculationArr.W
    calculationArr.cllref = 2.305988565
    calculationArr.RequiredCII = 2.282928679
    calculationArr.superiorBoundary = 1.872001517
    calculationArr.lowerBoundary = 2.123123672
    calculationArr.upperBoundary  = 2.4199044
    calculationArr.inferiorBoundary = 2.92214871
    if (!news) {
        const calculationData = await DB.insert('calculation', calculationArr)
        return calculationData
    } else {
        let ChangedArr = {}
        await DB.find('calculation', {Date_UTC:params.Date_UTC}).then((data) => {
            ChangedArr = data[0] || {}
        })
        let frontArr = {}
        for (const key in ChangedArr) {
            if (key != '_id') {
                frontArr[key] = ChangedArr[key]
            }
        }
        delete calculationArr.id
        const calculationData = await DB.update('calculation', frontArr, calculationArr)
        return calculationData
    }
}

// 修改
router.post("/cllNewretown/modify", async (ctx) => {
    // 查询id
    let Date_UTC = ctx.request.body.Date_UTC
    let ChangedArr = {}
    await DB.find('aim', {Date_UTC}).then((data) => {
        ChangedArr = data[0] || {}
    })
    let frontArr = {}
    for (const key in ChangedArr) {
        if (key != '_id') {
            frontArr[key] = ChangedArr[key]
        }
    }
    // 修改内容
    let body = ctx.request.body
    body.IMO=body.IMO
    body.Date_UTC=body.Date_UTC
    body.Time_UTC=body.Time_UTC
    body.Voyage_From=body.Voyage_From
    body.Voyage_To=body.Voyage_To
    body.Latitude_Degree=body.Latitude_Degree
    body.Latitude_Minutes=body.Latitude_Minutes
    body.Latitude_North_South=body.Latitude_North_South
    body.Longitude_Degree=body.Longitude_Degree
    body.Longitude_Minutes=body.Longitude_Minutes
    body.Longitude_East_West=body.Longitude_East_West
    body.Event=body.Event
    body.Time_Since_Previous_Report=body.Time_Since_Previous_Report
    body.Time_Elapsed_Anchoring=body.Time_Elapsed_Anchoring
    body.Distance=body.Distance
    body.Cargo_Mt=body.Cargo_Mt
    body.ME_Consumption_HFO=body.ME_Consumption_HFO
    body.ME_Consumption_MGO=body.ME_Consumption_MGO
    body.HFO_ROB=body.HFO_ROB
    body.MGO_ROB=body.MGO_ROB
    body.shopId=body.shopId
    body.VoyageId = body.VoyageId
    await calculationFnc(body, true)
    const datas = await DB.update('aim', frontArr, body)
    let dt = {}
    if (datas.result.ok === 1) {
        await DB.find('shipNo', {id: body.VoyageId}).then(async(data) => {
            const shipNodatas = data[0] || {}
            await DB.update('shipNo', shipNodatas, {
                surplusvModelData:body.surplusvModelData
            })
        })
        dt = {
            start: 200,
            msg: '修改成功'
        }
    } else {
        console.log(123);
    }
    ctx.body = JSON.stringify(dt);

})
// 查询分页
router.post("/cllNewretown/paging", async (ctx) => {
    //koa-bodyparser解析前端参数
    let reqParam = ctx.request.body;
    let querys = String(reqParam.query);//检索内容
    let page = Number(reqParam.pagenum);//当前第几页
    let size = Number(reqParam.pagesize);//每页显示的记录条数
    const everyOne =  await DB.find('cllNewretown', {})
    await DB.count('cllNewretown', { shipsId: Number(querys) }, size, (page - 1) * size).then((datas) => {
        ctx.body = JSON.stringify({totalpage:everyOne.length, pagenum:page, pagesize:size, data: datas})
    })
    //是否还有更多
    // let hasMore=totle-(page-1)*size>size?true:false;
})

// 查询分页
router.post("/calculation/paging", async (ctx) => {
    //koa-bodyparser解析前端参数
    let reqParam = ctx.request.body;
    let IMO = reqParam.IMO;//检索内容
    let page = Number(reqParam.pagenum);//当前第几页
    let size = Number(reqParam.pagesize);//每页显示的记录条数
    const everyOne = await DB.find('calculation', {})

    let getData = {}
    if (reqParam.IMO) {
        getData.shopId = IMO
    }
    await DB.count('calculation', getData, size, (page - 1) * size).then((datas) => {
        if (reqParam.displayMode != 0) {
            if (reqParam.displayMode == 1) {
                let itemDt = []
                datas.forEach(item => {
                    if (item.Date_UTC) {
                        let date1 = getLastDay1();
                        let date2 = getLastDay2();
                        const Date_UTC = new Date(item.Date_UTC.replace(/-/g, "/"))
                        if (new Date(date1.replace(/-/g, "/")) <Date_UTC&&Date_UTC< new Date(date2.replace(/-/g, "/"))) {
                            itemDt.push(item)
                        }
                    }
                })
                ctx.body = JSON.stringify({totalpage:itemDt.length, pagenum:page, pagesize:size, data: itemDt})
            }
            if (reqParam.displayMode == 2) {
                let date = new Date()
                const startTime =new Date(new Date(date).getTime() - (3600 * 1000 * 24 * (new Date(date).getDay() == 0 ? 6 : new Date(date).getDay()-1)))
                const endTime =new Date(new Date(date).getTime()+(3600*1000*24* (new Date(date).getDay()==0 ? 0:7- new Date(date).getDay(date))))
                let itemDt = []
                datas.forEach(item => {
                    if (item.Date_UTC) {
                        const Date_UTC = new Date(item.Date_UTC.replace(/-/g, "/"))
                        if (startTime <Date_UTC&&Date_UTC< endTime) {
                            itemDt.push(item)
                        }
                    }
                })
                ctx.body = JSON.stringify({totalpage:itemDt.length, pagenum:page, pagesize:size, data: itemDt})
            }
            if (reqParam.displayMode == 3) {
                ctx.body = JSON.stringify({totalpage:everyOne.length, pagenum:page, pagesize:size, data: datas})
            }
        } else {
            let itemDt = []
            datas.forEach(item => {
                if (item.VoyageId) {
                    if (item.VoyageId==reqParam.VoyageId) {
                        itemDt.push(item)
                    }
                }
            })
            ctx.body = JSON.stringify({totalpage:itemDt.length, pagenum:page, pagesize:size, data: itemDt})
        }
    })
})

function getLastDay1(){
    let y = new Date().getFullYear(); //获取年份
    let m = new Date().getMonth() + 1; //获取月份
    let d = '01'
    m = m < 10 ? '0' + m : m; //月份补 0
    
    return [y,m,d].join("-")
}
function getLastDay2(){
    let y = new Date().getFullYear(); //获取年份
    let m = new Date().getMonth() + 1; //获取月份
    let d = new Date(y, m, 0).getDate(); //获取当月最后一日
    m = m < 10 ? '0' + m : m; //月份补 0
    d = d < 10 ? '0' + d : d; //日数补 0
    return [y,m,d].join("-")
}
// id查询
router.get("/calculationuserid/:id", async (ctx) => {
    let ids = ctx.params
    let id = parseInt(ids.id)
    await DB.find('calculation', {shopId: id}).then((data) => {
        ctx.body = JSON.stringify(data); // 响应请求，发送处理后的信息给客户端
    })
})

// 创建船次号
router.post("/shipNo/create", async (ctx) => {
    let body = ctx.request.body
    const dataId = await DB.find('shipNo', {})
    const lastId = dataId.length != 0 ? dataId[dataId.length - 1].id + 1 : 1
    const setPortLatitude = dataModule.coordinatesConvertDegreeMinuteSecond(body.setPort.latitude)
    const setPortLongitude = dataModule.coordinatesConvertDegreeMinuteSecond(body.setPort.longitude)
    const endPortLatitude = dataModule.coordinatesConvertDegreeMinuteSecond(body.endPort.latitude)
    const endPortLongitude = dataModule.coordinatesConvertDegreeMinuteSecond(body.endPort.longitude)
    const params = {
        IMO:body.IMO,
        shopId:body.shopId,
        Voyage:body.Voyage,
        setPort:body.setPort.value,
        endPort:body.endPort.value,
        setPortName:body.setPort.label,
        endPortName:body.endPort.label,
        beginTime:body.beginTime,
        endTime: body.endTime,
        surplusvModelData: body.surplusvModelData,
        setPortLatitude,
        setPortLongitude,
        endPortLatitude,
        endPortLongitude,
        id:lastId
    }
    const data = await DB.insert('shipNo', params)
    let dt = {}
    if (data.result.ok === 1) {
        dt = {
            start: 200,
            msg: '船次号创建成功',
            data: data.ops[0]
        }
    } else {
        dt = {
            start: 400,
            msg: '船次号创建失败'
        }
    }
    ctx.body = JSON.stringify(dt);
})


// 查询船次号
router.post("/shipNo/paging", async (ctx) => {
    //koa-bodyparser解析前端参数
    let reqParam = ctx.request.body;
    let querys = Number(reqParam.query);//检索内容
    let arr = {}
    if (querys) {
        arr = {shopId: querys}
    }
    await DB.find('shipNo', arr).then((data) => {
        ctx.body = JSON.stringify(data); // 响应请求，发送处理后的信息给客户端
    })
})
// 查询上次结束航次号
router.get("/shipNoYesterday", async (ctx) => {
    const data = await DB.find('shipNo', {})
    const lastData = data[data.length - 2] || {}
    const dt = {
        static: 200,
        data: lastData
    }
    ctx.body = JSON.stringify(dt);
})

// 创建船舶
router.post("/shipping/create", async (ctx) => {
    let body = ctx.request.body
    const dataId = await DB.find('shipping', {})
    const lastId = dataId.length != 0 ? dataId[dataId.length - 1].id + 1 : 1
    const params = {
        IMO: body.IMO,
        vModelData: body.vModelData,
        load: body.load,
        id:lastId
    }
    const data = await DB.insert('shipping', params)
    let dt = {}
    if (data.result.ok === 1) {
        dt = {
            start: 200,
            msg: '船舶创建成功'
        }
    } else {
        dt = {
            start: 400,
            msg: '船舶创建失败'
        }
    }
    ctx.body = JSON.stringify(dt);
})
// 查询船舶
router.post("/shipping/paging", async (ctx) => { 
    //koa-bodyparser解析前端参数
    let reqParam = ctx.request.body;
    let querys = String(reqParam.query);//检索内容
    let arr = {}
    if (querys) {
        arr = {IMO: querys}
    }
    await DB.find('shipping', arr).then((data) => {
        ctx.body = JSON.stringify(data); // 响应请求，发送处理后的信息给客户端
    })
})
// 查询分页
router.post("/shippingPage/paging", async (ctx) => {
    //koa-bodyparser解析前端参数
    let reqParam = ctx.request.body;
    // let querys = String(reqParam.query);//检索内容
    let page = Number(reqParam.pagenum);//当前第几页
    let size = Number(reqParam.pagesize);//每页显示的记录条数
    const everyOne =  await DB.find('shipping', {})
    await DB.count('shipping', {}, size, (page - 1) * size).then((datas) => {
        ctx.body = JSON.stringify({totalpage:everyOne.length, pagenum:page, pagesize:size, data: datas})
    })
    //是否还有更多
    // let hasMore=totle-(page-1)*size>size?true:false;
})


router.delete("/knowleImguser", async (ctx) => {
    let ids = ctx.params
    let id = parseInt(ids.id)
    const data = await DB.remove('shipping', {})
    ctx.body = JSON.stringify(data); // 响应请求，发送处理后的信息给客户端
})
module.exports = router