const koa = require( 'koa')
const bodyParser= require('koa-bodyparser')
const app = new koa()
const router = require('koa-router')()
const DB = require('../db')
app.use(bodyParser());
const dataModule = require('../data');
// =====================================================

// aim查询
router.post("/aimQuery", async (ctx) => {
    let shippingId = ctx.request.body.shippingId
    const data = await DB.find('aim', {shippingId})
    const lastData = data.length!=0 ? data:[]
    const dt = {
        static: 200,
        data: lastData
    }
    ctx.body = JSON.stringify(dt);
})
router.post("/aimQuery/paging", async (ctx) => {
    //koa-bodyparser解析前端参数
    let reqParam = ctx.request.body;
    let shippingId = Number(reqParam.shippingId);
    let page = Number(reqParam.pagenum);//当前第几页
    let size = Number(reqParam.pagesize);//每页显示的记录条数
    const everyOne =  await DB.find('aim', {})
    await DB.count('aim', {shippingId}, size, (page - 1) * size).then((datas) => {
        ctx.body = JSON.stringify({totalpage:everyOne.length, pagenum:page, pagesize:size, data: datas})
    })
    //是否还有更多
    // let hasMore=totle-(page-1)*size>size?true:false;
})
// 查询昨天
router.post("/aimYester", async (ctx) => {
    let shippingId = ctx.request.body.shippingId
    const data = await DB.find('aim', {shippingId})
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
        ME_Consumption_HFO:body.ME_Consumption_HFO||0,
        ME_Consumption_MGO:body.ME_Consumption_MGO||0,
        HFO_ROB:body.HFO_ROB||0,
        MGO_ROB:body.MGO_ROB||0,
        shippingId:body.shippingId,
        id:lastId
    }
    await calculationFnc(params, false)
    const data = await DB.insert('aim', params)
    let dt = {}
    if (data.result.ok === 1) {
        dt = {
            start: 200,
            msg: '上传成功'
        }
    } else {
        dt = {
            start: 500,
            msg: '上传失败'
        }
    }
    ctx.body = JSON.stringify(dt);
})


const calculationFnc = async(params, news) => {
    const calculation = await DB.find('calculation', {shippingId: params.shippingId})
    const shippingDt = await DB.find('shipping', {id: params.shippingId})
    const calculationId = calculation.length != 0 ? calculation[calculation.length - 1].id + 1 : 1
    let CumulativeDistance = 0
    let CumulativeME_Consumption = 0
    if (calculation.length==0 || params.Voyage_From == calculation[calculation.length - 1]?.Voyage_To) {
        CumulativeDistance =Number(params.Distance)
        CumulativeME_Consumption =Number(Number(params.ME_Consumption_HFO)+Number(params.ME_Consumption_MGO))
    } else {
        CumulativeDistance =Number(params.Distance)+Number(calculation[calculation.length - 1]?.CumulativeDistance||0)
        CumulativeME_Consumption =Number(Number(params.ME_Consumption_HFO)+Number(params.ME_Consumption_MGO)+Number(calculation[calculation.length - 1]?.CumulativeME_Consumption||0))
    }
    let calculationArr = {
        Date_UTC: params.Date_UTC,
        Voyage_From: params.Voyage_From,
        Voyage_To: params.Voyage_To,
        Distance: Number(params.Distance),
        CumulativeDistance,
        ME_Consumption: Number(Number(params.ME_Consumption_HFO)+Number(params.ME_Consumption_MGO)),
        CumulativeME_Consumption,
        id: calculationId,
        IMO:params.IMO,
        shippingId: params.shippingId,
    }
    calculationArr.CumulativeME_Consumption=calculationArr.CumulativeME_Consumption.toFixed(2)
    calculationArr.CumulativeDistance=calculationArr.CumulativeDistance.toFixed(2)
    const shippingItem = shippingDt[0] || {}
    const calculationitem = calculation[0]||{}
    const fuelTypes = params.ME_Consumption_HFO != 0 ? 'HFO':'LFO';
    // for (const iterator of shippingItem.vModelData) {
        
    // }
    const Capacitys =dataModule.Capacity(
        shippingItem.models,
        shippingItem.summerDeadWeight,
        shippingItem.gt
    )
    calculationArr.W = Capacitys * shippingItem.summerDeadWeight*calculationArr.CumulativeDistance
    calculationArr.M = dataModule.fc(
        shippingItem.models,
        shippingItem.summerDeadWeight,
        1,
        shippingItem.summerDeadWeight,
    )*1000000*dataModule.CF(fuelTypes)*calculationArr.CumulativeME_Consumption
    calculationArr.AttainedCII = calculationArr.M / calculationArr.W
    calculationArr.performance = params.AttainedCII <= calculationitem?.AttainedCII ? '上' : '下';
    let Year_Reduction = {'2019':0, '2020':1, '2021':2, '2022':3, '2023':5, '2024':7, '2025':9, '2026':11}
    const z = Year_Reduction[params.Date_UTC.slice(0,4)];
    calculationArr.CllRef = dataModule.REQCII(
        shippingItem.models,
        shippingItem.summerDeadWeight,
        shippingItem.gt
    )
    calculationArr.RequiredCII = (1 - z / 100) * calculationArr.CllRef
    calculationArr.boundary = dataModule.Rating_Director(
        shippingItem.models,
        Capacitys,
        calculationArr.RequiredCII,
        calculationArr.AttainedCII,
    )
    calculationArr.superiorBoundary =dataModule.boundary(
        shippingItem.models,
        Capacitys,
        calculationArr.RequiredCII,
        0
    )
    calculationArr.lowerBoundary =dataModule.boundary(
        shippingItem.models,
        Capacitys,
        calculationArr.RequiredCII,
        1
    )
    calculationArr.upperBoundary =dataModule.boundary(
        shippingItem.models,
        Capacitys,
        calculationArr.RequiredCII,
        2
    )
    calculationArr.inferiorBoundary =dataModule.boundary(
        shippingItem.models,
        Capacitys,
        calculationArr.RequiredCII,
        3
    )
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
        ME_Consumption_HFO:body.ME_Consumption_HFO||0,
        ME_Consumption_MGO:body.ME_Consumption_MGO||0,
        HFO_ROB:body.HFO_ROB||0,
        MGO_ROB:body.MGO_ROB||0,
        shippingId:body.shippingId,
    }
    // await calculationFnc(body, true)
    const datas = await DB.update('aim', frontArr, params)
    let dt = {}
    if (datas.result.ok === 1) {
        dt = {
            start: 200,
            msg: '修改成功'
        }
    } else {
        dt = {
            start: 500,
            msg: '修改失败'
        }
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
router.post("/CIICalculation/paging", async (ctx) => {
    //koa-bodyparser解析前端参数
    let reqParam = ctx.request.body;
    let querys = String(reqParam.query);//检索内容
    let page = Number(reqParam.pagenum);//当前第几页
    let size = Number(reqParam.pagesize);//每页显示的记录条数
    const everyOne =  await DB.find('calculation', {})
    await DB.count('calculation', { shippingId: Number(querys) }, size, (page - 1) * size).then((datas) => {
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
        getData.shippingId = IMO
    }
    await DB.find('calculation', getData).then((datas) => {
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
                ctx.body = JSON.stringify({totalpage:datas.length, pagenum:page, pagesize:size, data: itemDt.splice(page==1?0:page*size-size+1,size)})
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
                ctx.body = JSON.stringify({totalpage:datas.length, pagenum:page, pagesize:size, data: itemDt.splice(page==1?0:page*size-size+1,size)})
            }
            if (reqParam.displayMode == 3) {
                ctx.body = JSON.stringify({totalpage:everyOne.length, pagenum:page, pagesize:size, data: datas.splice(page==1?0:page*size-size+1,size)})
            }
        } else {
            let itemDt = []
            datas.forEach(item => {
                if (item.shippingId) {
                    if (item.shippingId==reqParam.IMO) {
                        itemDt.push(item)
                    }
                }
            })
            ctx.body = JSON.stringify({totalpage:datas.length, pagenum:page, pagesize:size, data: itemDt.splice(page==1?0:page*size-size+1,size)})
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
        aeFuelType: body.aeFuelType,
        aeNumber: body.aeNumber,
        aeSMCR: body.aeSMCR,
        aeType: body.aeType,
        aeVmodelData: body.aeVmodelData,
        ballastDraughtTop: body.ballastDraughtTop,
        ballastDraughtTail: body.ballastDraughtTail,
        betwLength: body.betwLength,
        classCcs: body.classCcs,
        designDraught: body.designDraught,
        fuelType: body.fuelType,
        gt: body.gt,
        lengthOverAll: body.lengthOverAll,
        limitEEXI: body.limitEEXI,
        limitEEXIRpm: body.limitEEXIRpm,
        load: body.load,
        meCSR: body.meCSR,
        meCsrRpm: body.meCsrRpm,
        meNumber: body.meNumber,
        meSMCR: body.meSMCR,
        meSmcrRpm: body.meSmcrRpm,
        meType: body.meType,
        models: body.models,
        name: body.name,
        numberNo: body.numberNo,
        remarks: body.remarks,
        scantlingDraught: body.scantlingDraught,
        shipBreadth: body.shipBreadth,
        shipDesigner: body.shipDesigner,
        shipbuilding: body.shipbuilding,
        shipowner: body.shipowner,
        summerDeadWeight: body.summerDeadWeight,
        vModelData: body.vModelData,
        id: lastId,
        indexId:lastId
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
// 修改
router.post("/shipping/modify", async (ctx) => {
    // 查询id
    let id = ctx.request.body.id
    let ChangedArr = {}
    await DB.find('shipping', {id}).then((data) => {
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
    const params = {
        IMO: body.IMO,
        aeFuelType: body.aeFuelType,
        aeNumber: body.aeNumber,
        aeSMCR: body.aeSMCR,
        aeType: body.aeType,
        aeVmodelData: body.aeVmodelData,
        ballastDraughtTop: body.ballastDraughtTop,
        ballastDraughtTail: body.ballastDraughtTail,
        
        betwLength: body.betwLength,
        classCcs: body.classCcs,
        designDraught: body.designDraught,
        fuelType: body.fuelType,
        gt: body.gt,
        lengthOverAll: body.lengthOverAll,
        limitEEXI: body.limitEEXI,
        limitEEXIRpm: body.limitEEXIRpm,
        
        load: body.load,
        meCSR: body.meCSR,
        meCsrRpm: body.meCsrRpm,
        meNumber: body.meNumber,
        meSMCR: body.meSMCR,
        meSmcrRpm: body.meSmcrRpm,
        meType: body.meType,
        models: body.models,
        name: body.name,
        numberNo: body.numberNo,
        remarks: body.remarks,
        scantlingDraught: body.scantlingDraught,
        shipBreadth: body.shipBreadth,
        shipDesigner: body.shipDesigner,
        shipbuilding: body.shipbuilding,
        shipowner: body.shipowner,
        summerDeadWeight: body.summerDeadWeight,
        vModelData: body.vModelData,
    }
    // await calculationFnc(body, true)
    const datas = await DB.update('shipping', frontArr, params)
    let dt = {}
    if (datas.result.ok === 1) {
        dt = {
            start: 200,
            msg: '修改成功'
        }
    } else {
        dt = {
            start: 500,
            msg: '修改失败'
        }
    }
    ctx.body = JSON.stringify(dt);

})
router.post("/shipping/forModify", async (ctx) => {
    let arrs = ctx.request.body.arrs
    let ok = true
    for (const iterator of arrs) {
        delete iterator._id
        const datas = await DB.update('shipping', { id: iterator.id }, iterator)
        if (datas.result.ok!=1) {
            ok=false
        }
    }
    // await calculationFnc(body, true)
    let dt = {}
    if (ok) {
        dt = {
            start: 200,
            msg: '修改成功'
        }
    } else {
        dt = {
            start: 500,
            msg: '修改失败'
        }
    }
    ctx.body = JSON.stringify(dt);

})
// 查询船舶
router.post("/shipping/paging", async (ctx) => { 
    //koa-bodyparser解析前端参数
    let reqParam = ctx.request.body;
    let querys = Number(reqParam.query);//检索内容
    let arr = {}
    if (querys) {
        arr = {id: querys}
    }
    await DB.find('shipping', arr).then((data) => {
        data.sort((a,b) =>{
            return a.indexId - b.indexId
        })
        ctx.body = JSON.stringify(data||[]); // 响应请求，发送处理后的信息给客户端
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