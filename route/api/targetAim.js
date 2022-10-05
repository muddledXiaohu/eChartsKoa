const koa = require( 'koa')
const bodyParser= require('koa-bodyparser')
const app = new koa()
const router = require('koa-router')()
const DB = require('../db')
app.use(bodyParser());
// =====================================================

// 查询昨天
router.post("/cllNewretown", async (ctx) => {
    let sameTime = ctx.request.body.sameTime
    const data = await DB.find('cllNewretown', {sameTime})
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

// 创建
router.post("/cllNewretown/create", async (ctx) => {
    let body = ctx.request.body
    const dataId = await DB.find('cllNewretown', {})
    const lastId = dataId.length != 0 ? dataId[dataId.length - 1].id + 1 : 1
    const params = {
        shipName:body.shipName,
        mileageDay:body.mileageDay,
        oilConsumption:body.oilConsumption,
        sameTime:body.sameTime,
        tFC:body.tFC,
        odometer:body.odometer,
        shipsId:body.shipsId,
        id:lastId
    }
    params.M = params.tFC*3.114*1000*1000
    params.W = params.odometer * 318689
    params.attainedCII = params.M/params.W
    params.refCII = 5247 * 318689 ^ (-0.61)
    params.requiredCll = 0.99 * params.refCII
    params.superiorBoundary = 0.82 * params.requiredCll
    params.lowerBoundary = 0.93 * params.requiredCll
    params.upperBoundary = 1.06 * params.requiredCll
    params.inferiorBoundary = 1.28 * params.requiredCll
    const data = await DB.insert('cllNewretown', params)
    let dt = {}
    if (data.result.ok === 1) {
        dt = {
            start: 200,
            msg: '上传成功'
        }
    } else {
        console.log(data);
    }
    ctx.body = JSON.stringify(dt);
})

// 修改
router.post("/cllNewretown/modify/:sameTime", async (ctx) => {
    // 查询id
    let sameTime = ctx.params.sameTime
    let ChangedArr = {}
    await DB.find('cllNewretown', {sameTime: sameTime}).then((data) => {
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
    body.M = body.tFC*3.114*1000*1000
    body.W = body.odometer * 318689
    body.attainedCII = body.M/body.W
    body.refCII = 2.30598856512529
    body.requiredCll = 0.99 * body.refCII
    body.superiorBoundary = 0.82 * body.requiredCll
    body.lowerBoundary = 0.93 * body.requiredCll
    body.upperBoundary = 1.06 * body.requiredCll
    body.inferiorBoundary = 1.28 * body.requiredCll
    console.log(body);
    const datas = await DB.update('cllNewretown', frontArr, body)
    let dt = {}
    if (datas.result.ok === 1) {
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



// 创建船次号
router.post("/shipNo/create", async (ctx) => {
    let body = ctx.request.body
    const dataId = await DB.find('shipNo', {})
    const lastId = dataId.length != 0 ? dataId[dataId.length - 1].id + 1 : 1
    const params = {
        shopName:body.shopName,
        shopId:body.shopId,
        imo:body.imo,
        setPort:body.setPort,
        endPort:body.endPort,
        beginTime:body.beginTime,
        endTime:body.endTime,
        longitude:body.longitude,
        latitude:body.latitude,
        mileageTotal:body.mileageTotal,
        mileageRemaining:body.mileageRemaining,
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

// 创建船舶
router.post("/shipping/create", async (ctx) => {
    let body = ctx.request.body
    const dataId = await DB.find('shipping', {})
    const lastId = dataId.length != 0 ? dataId[dataId.length - 1].id + 1 : 1
    const params = {
        username:body.username,
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
        arr = {username: querys}
    }
    await DB.find('shipping', arr).then((data) => {
        ctx.body = JSON.stringify(data); // 响应请求，发送处理后的信息给客户端
    })
})


module.exports = router