const koa = require( 'koa')

const bodyParser= require('koa-bodyparser')
const fs= require('fs')
const path = require('path')
const xlsx = require("node-xlsx");

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
    const file = ctx.request.files;
    const sheets = xlsx.parse(file.files.path);
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
                Time_UTC: arr.Time_UTC
            }
            let ChangedData = {}
            await DB.find('aim', cx).then((data) => {
                ChangedData = data[0] || {}
            })
            if (ChangedData?.id) {
                await DB.update('aim', cx, arr)
            } else {
                arr.id = ids++
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
module.exports = router