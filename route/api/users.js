const koa = require( 'koa')

const bodyParser= require('koa-bodyparser')
const fs= require('fs')
const path = require('path')
const xlsx = require("node-xlsx");
const dataModule = require('../data');

// 实例化
const app = new koa()
const router = require('koa-router')()

const DB = require('../db')

// 引入token生成
const jwt = require('jsonwebtoken')

app.use(bodyParser());      // 将模块作为koa的中间件引入

// 创建管理员用户
router.post("/user/create", async (ctx) => {
    let body = ctx.request.body
    
    const dataId = await DB.find('administrators', {})
    const lastId = dataId.length != 0 ? dataId[dataId.length - 1].id + 1 : 1
    const ids = lastId

    const params = {
        username:body.username,
        password:body.password,
        id:ids
    }
    const data = await DB.insert('administrators', params)
    ctx.body = JSON.stringify(data);
})

router.get("/user/administrators", async (ctx) => {
    const data = await DB.find('administrators', {})
    ctx.body = JSON.stringify(data);
})
// id查询
router.get("/user/administratorsId/:id", async (ctx) => {
    let ids = ctx.params
    let id = parseInt(ids.id)
    await DB.find('administrators', { id: id }).then((data) => {
        
        ctx.body = JSON.stringify(data);
    })
})

// 修改管理员用户
router.post("/user/modify/:id", async (ctx) => {
    // 查询id
    let ids = ctx.params
    let id = parseInt(ids.id)
    let ChangedData = []
    await DB.find('administrators', {id: id}).then((data) => {
        ChangedData = data
    })
    let username = ''
    let password = ''
    for (const key in ChangedData) {
       username = ChangedData[key].username
       password = ChangedData[key].password
    }
    const original = {
        username: username,
        password: password
    }

    // 修改内容
    let body = ctx.request.body
    const datas = await DB.update('administrators', original, body)
    ctx.body = JSON.stringify(datas);

})

// 删除用户
router.delete("/user/remove/:id", async (ctx) => {
    let ids = ctx.params
    let id = parseInt(ids.id)
    const data = await DB.remove('administrators', {id: id})
    ctx.body = JSON.stringify(data);
})

// 用户登录
router.post('/user/login', async ctx => {
    const data = ctx.request.body
    await DB.find('administrators', { username: data.username }).then((datas) => {

        if (datas.length === 0) {
            ctx.body = {
                'code': 0,
                'data': {},
                'msg': '没有该用户，请注册',
                status: 400
            }
            return
        }
        let password = datas[0].password
        let username = datas[0].username
        if (password !== data.password) {
            ctx.body = {
                'code': 0,
                'data': {},
                'msg': '密码错误',
                status: 400
            }
        } else {
            const secret = 'cllSecret'
            let payload = {
                username: username,
                time: new Date().getTime(),
                timeout: 1000 * 60 * 60 * 2
            }
            let token = jwt.sign(payload, secret);
            // console.log(token)
            ctx.body = {
                'code': 1,
                'data': {
                    token
                },
                'msg': '登录成功',
                status: 200
            }
        }
    })
})

router.post('/analysisExcel', async ctx => {
    const { file } = ctx.request.files;
    const {type} = ctx.request.body
    const sheets = xlsx.parse(file.path);
    const sheetData = sheets[0].data;
    let result = [];
    const dataId = await DB.find('aim', {})
    const lastId = dataId.length != 0 ? dataId[dataId.length - 1].id + 1 : 1
    let ids = lastId
    let KeyMp = {}
    // 字段过滤
    
    let it = 0
    for (const iterator of sheetData[0]) {
        KeyMp[it] = iterator
        it++
    }
    for (const idx in sheetData) {
        let arr = {}
        if (idx != 0) {
            for (const key in sheetData[idx]) {
                arr[KeyMp[key]] = sheetData[idx][key] || 1
            }
            const cx = {
                Date_UTC: arr.Date_UTC,
                shippingId:Number(type)
            }
            arr.shippingId = Number(type)
            // const calculationData = await calculationFnc(arr, false)
            let ChangedData = {}
            await DB.find('aim', cx).then((data) => {
                ChangedData = data[0] || {}
            })
            if (ChangedData?.id) {
                await DB.update('aim', cx, arr)
                // await calculationFnc(arr, true)
            } else {
                arr.id = ids++
                await calculationFnc(arr, false)
                result.push(arr)
            }
        }
    }
    // fs.unlinkSync(result);
    let data = {}
    if (result.length != 0) {
        data = await DB.insertMany('aim', result)
    }
    ctx.body = JSON.stringify(data);
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

// 查询分页
router.post("/aim/paging", async (ctx) => {
    //koa-bodyparser解析前端参数
    let reqParam = ctx.request.body;
    let querys = String(reqParam.query);//检索内容
    let page = Number(reqParam.pagenum);//当前第几页
    let size = Number(reqParam.pagesize);//每页显示的记录条数
    const everyOne = await DB.find('aim', {VoyageId: Number(querys)})
    await DB.count('aim', {VoyageId: Number(querys)}, size, (page - 1) * size).then((datas) => {
        ctx.body = JSON.stringify({totalpage:everyOne.length, pagenum:page, pagesize:size, data: datas})
    })
    //是否还有更多
    // let hasMore=totle-(page-1)*size>size?true:false;
})
module.exports = router