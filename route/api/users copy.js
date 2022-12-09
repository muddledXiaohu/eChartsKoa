
const koa = require( 'koa')


const bodyParser= require('koa-bodyparser')
const fs= require('fs')
const path= require('path')

// 实例化
const app = new koa()

const router = require('koa-router')()


const DB = require('../db')

// 引入token生成
const jwt = require('jsonwebtoken')

app.use(bodyParser());      // 将模块作为koa的中间件引入

// =====================================================


/**
 * 引用sdk
 */
const SMSClient = require('@alicloud/sms-sdk')
// const accessKeyId = 'LTAIg5XMSovEBYNT' //你自己在阿里云后台的accessKeyId
// const secretAccessKey = 'xDTlklr8LNeBah1FHXkA2C9AI9Fi8x' //secretAccessKey
// const singName = '中奥易安'

const accessKeyId = 'LTAI5tA4MC22mxRzRzFMEyNp' //你自己在阿里云后台的accessKeyId
const secretAccessKey = 'hyTPu376WEG2FAlA5iMNyG7oW6u96w' //secretAccessKey
const singName = '浙法培训'

var qr = require('qr-image');

const uuid = require('node-uuid')


// params.M = params.tFC*3.114*1000*1000
// params.W = params.odometer * 318689
// params.attainedCII = params.M/params.W
// params.refCII = 5247 * 318689 ^ (-0.61)
// params.requiredCll = 0.99 * params.refCII
// params.superiorBoundary = 0.82 * params.requiredCll
// params.lowerBoundary = 0.93 * params.requiredCll
// params.upperBoundary = 1.06 * params.requiredCll
// params.inferiorBoundary = 1.28 * params.requiredCll
// 查询全部考题信息
router.get("/integKAOt", async (ctx) => {
    const data = await DB.find('subject', {})
    ctx.body = JSON.stringify(data); // 响应请求，发送处理后的信息给客户端
})
// =====================================================

// 查询全部信息
router.get("/users", async (ctx) => {
    const data = await DB.find('users', {})
    ctx.body = JSON.stringify(data); // 响应请求，发送处理后的信息给客户端
})

// id查询
router.get("/users/:id", async (ctx) => {
    let ids = ctx.params
    let id = parseInt(ids.id)
    await DB.find('users', {id: id}).then((data) => {
        ctx.body = JSON.stringify(data); // 响应请求，发送处理后的信息给客户端
    })
})

// 创建用户
router.post("/users/establish", async (ctx) => {
    let body = ctx.request.body
    
    const dataId = await DB.find('users', {})
    const lastId = dataId[dataId.length - 1]
    const ids = lastId.id + 1

    const params = {
        username:body.username,
        password:body.password,
        mobile:body.mobile,
        id:ids
    }
    const data = await DB.insert('users', params)
    ctx.body = JSON.stringify(data); // 响应请求，发送处理后的信息给客户端
})

// 修改用户
router.post("/users/modify/:id", async (ctx) => {
    // 查询id
    let ids = ctx.params
    let id = parseInt(ids.id)
    var ChangedData = []
    await DB.find('users', {id: id}).then((data) => {
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
    const datas = await DB.update('users', original, body)
    // console.log(datas.result);
    ctx.body = JSON.stringify(datas); // 响应请求，发送处理后的信息给客户端

})

// 删除用户
router.delete("/users/remove/:id", async (ctx) => {
    let ids = ctx.params
    let id = parseInt(ids.id)
    const data = await DB.remove('users', {id: id})
    // console.log(data.result);
})

// 用户登录
router.post('/login', async ctx => {
    const data = ctx.request.body
    await DB.find('users', {username: data.username}).then((datas) => {
        for (const key in datas) {
            var password = datas[key].password
            var username = datas[key].username
        }
        if (datas.length === 0) {
            ctx.body = {
                'code': 0,
                'data': {},
                'mesg': '没有该用户，请注册',
                status: 400
            }    
        } else if (password !== data.password) {
            ctx.body = {
                'code': 0,
                'data': {},
                'mesg': '密码错误',
                status: 400
            }

        } else {
            const secret = 'secret'
            function getToken(payload = {}) {
                return jwt.sign(payload, secret, { expiresIn: '4h' })
            }
            let token = getToken({uid: "12306", username: username}) // 将关键信息记录与 Token 内
            // console.log(token)
            ctx.body = {
                'code': 1,
                'data': {
                    token
                },
                'mesg': '登录成功',
                status: 200
            }
        }
    })
  })

//   预约号登录
router.post('/loginNumber', async ctx => {
    const data = ctx.request.body
    await DB.find('appointment', {number: data.number}).then((datas) => {
        if (datas.length === 0) {
            ctx.body = {
                'code': 0,
                'data': {},
                'mesg': '没有该预约，请进行预约',
                status: 400
            }    
        } else {
            const secret = 'secret'
            function getToken(payload = {}) {
                return jwt.sign(payload, secret, { expiresIn: '4h' })
            }
            let token = getToken({uid: "12306", username: RQZHuser}) // 将关键信息记录与 Token 内
            ctx.body = {
                'code': 1,
                'data': {
                    datas
                },
                'mesg': '登录成功',
                status: 200,
                'token': token
            }
        }
    })
  })


//   =============================================
// 生成uuid二维码
var qwe = ''
router.get('/RQCode', async ctx => {
    var ID = uuid.v1();
    RQZHuser = {}
    qwe = ID
    try {
        var img = qr.image('http://192.168.3.75:8080/#/start?uid=' + ID,{size :10});
      
        ctx.type= 'image/png';
        ctx.body = img;
    } catch (e) {
        ctx.type='text/html;charset=utf-8';
        ctx.body='<h1>414 Request-URI Too Large</h1>';
    }

})


// 扫码调用接口
var RQZHuser = {}
router.post('/RQLongin', async ctx => {
    let body = ctx.request.body
    let user = body.username
    const RQlgs = {[qwe]: user}
    RQZHuser = RQlgs
    // console.log(RQZHuser)
    await DB.insert('RQCodeId', RQlgs).then((data) => {
        ctx.body = JSON.stringify(data); // 响应请求，发送处理后的信息给客户端
    })
})

// 二维码扫码成功后查询返回对应账户
router.get("/uuid/ZHuser", async (ctx) => {
    const secret = 'secret'
        function getToken(payload = {}) {
        return jwt.sign(payload, secret, { expiresIn: '4h' })
    }
    let token = getToken({uid: "12306", username: RQZHuser}) // 将关键信息记录与 Token 内
    if (Object.keys(RQZHuser).length != 0) {
        await DB.find('RQCodeId', RQZHuser).then((data) => {
            ctx.body = {
                'code': 0,
                'data': data,
                status: 200,
                'token': token
            }; // 响应请求，发送处理后的信息给客户端
            setTimeout(() => {
                RQZHuser = {}
                qwe = ''
            }, 1000);
        })
    }else{
        ctx.body = {
            'code': 0,
            'data': {},
            status: 400
        }
    }
})

// =====================================================


// 课程查询
router.post("/curriculim", async (ctx) => {
    //koa-bodyparser解析前端参数
    let reqParam= ctx.request.body;//
    let querys = String(reqParam.params.query);//检索内容
    let page = Number(reqParam.params.pagenum);//当前第几页
    let size = Number(reqParam.params.pagesize);//每页显示的记录条数

    const everyOne =  await DB.find('user', {username: querys}) //表总记录数
    //显示符合前端分页请求的列表查询
    // let options = { "limit": size,"skip": (page-1)*size};
    await DB.count('user', {username: new RegExp(querys)}, size, (page-1)*size).then((datas) => {
        //返回给前端
        ctx.body = JSON.stringify({totalpage:everyOne.length,pagenum:page,pagesize:size, users: datas})
    })
    //是否还有更多
    // let hasMore=totle-(page-1)*size>size?true:false;
})

// id查询
router.get("/knowleImguserid/:id", async (ctx) => {
    let ids = ctx.params
    let id = parseInt(ids.id)
    await DB.find('user', {id: id}).then((data) => {
        ctx.body = JSON.stringify(data); // 响应请求，发送处理后的信息给客户端
    })
})

router.get("/knowleImgusername/:username", async (ctx) => {
    let ids = ctx.params
    let username = ids.username
    await DB.find('user', {username: username}).then((data) => {
        ctx.body = JSON.stringify(data); // 响应请求，发送处理后的信息给客户端
    })
})

// 修改课程
router.post("/knowleImguser/modify/:id", async (ctx) => {
    // 查询id
    let ids = ctx.params
    let id = parseInt(ids.id)
    var ChangedData = []
    await DB.find('user', {id: id}).then((data) => {
        ChangedData = data
    })
    let image = ''
    for (const key in ChangedData) {
       image1 = ChangedData[key].image1
       image2 = ChangedData[key].image2
       image3 = ChangedData[key].image3
    }
    const original = {
        image1: image1,
        image2: image2,
        image3: image3,
    }
    // 修改内容
    let body = ctx.request.body
    const datas = await DB.update('user', original, body)
    // console.log(datas.result);
    ctx.body = JSON.stringify(datas); // 响应请求，发送处理后的信息给客户端
})


// 创建课程
router.post("/knowleImguser/establish", async (ctx) => {
    let body = ctx.request.body
    
    const dataId = await DB.find('user', {})
    const lastId = dataId[dataId.length - 1]
    const ids = lastId.id + 1

    const params = {
            username: body.username,
            id: ids,
            image1: body.image1,
            image2: body.image2,
            image3: body.image3,
            content1: body.content1,
            content2: body.content2,
            content3: body.content3
    }
    const data = await DB.insert('user', params)
    ctx.body = JSON.stringify(data); // 响应请求，发送处理后的信息给客户端
})


// 删除题目
router.delete("/knowleImguser/:id", async (ctx) => {
    let ids = ctx.params
    let id = parseInt(ids.id)
    const data = await DB.remove('user', {id: id})
    ctx.body = JSON.stringify(data); // 响应请求，发送处理后的信息给客户端
})

// ==============================================================================

/**
 * 发送短信验证码
 */

//发送短信
router.post('/sendmsg', async (ctx, next) =>{
  const data = ctx.request.body
  const numbers = String(data.numbers)//发送的电话号码
  let number = ''
  for(let i=0;i<6;i++){
      number+=Math.floor(Math.random()*10)
  }
  const hhuu = `{"code":"${number}"}`
  //初始化sms_client
  const smsClient = new SMSClient({accessKeyId, secretAccessKey})
  //发送短信
  try{
	 const s = await smsClient.sendSMS({
	     PhoneNumbers: numbers,//发送的电话号码
	     SignName: singName,//认证签名
	     // TemplateCode: 'SMS_156282482',//模板id 中奥
	     TemplateCode: 'SMS_226780222',//模板id 平安
	     TemplateParam: hhuu //特别注意，这里的参数名
	 })
	 if(s.Code=="OK"){
	     ctx.body = {code :1,msg :number}
	 }else{
	     ctx.body = {code :0}
	 } 
  }catch(e){
	  ctx.body = {code :0, msg:'短信发送失败'}
  }
  
});

//短信推送预约号
router.post('/sendmYYH', async (ctx, next) =>{
  const data = ctx.request.body
  const numbers = String(data.numbers) //发送的电话号码
  const number = data.number //预约号
  const hhuu = `{"code":"${number}"}`
  //初始化sms_client
  let smsClient = new SMSClient({accessKeyId, secretAccessKey})
  //发送短信
  const s = await smsClient.sendSMS({
      PhoneNumbers: numbers, //发送的电话号码
      SignName: singName, //认证签名
      // TemplateCode: 'SMS_207530018', //模板id 中奥
      TemplateCode: 'SMS_227251472', //模板id 平安
      TemplateParam: hhuu //特别注意，这里的参数名
  })
  if(s.Code=="OK"){
      ctx.body = {code :1,msg :number}
  }else{
      ctx.body = {code :0}
  }
})

//短信推送至管理员
router.post('/sendMaster/:phone', async(ctx)=>{
	const data = ctx.request.body;
	const phone = data.phone;
	const time = data.time;
	
	if(phone){
		//初始化sms_client
		let smsClient = new SMSClient({accessKeyId, secretAccessKey})
		let param = JSON.stringify({
			time: time,
			phone: phone
		})
		
		//发送短信
		const s = await smsClient.sendSMS({
		    PhoneNumbers: phone, //发送的电话号码
		    SignName: singName, //认证签名
		    // TemplateCode: 'SMS_226826356', //模板id 中奥
		    TemplateCode: 'SMS_227261315', //模板id 平安
		    TemplateParam: param //特别注意，这里的参数名
		})
		
	}
	
	ctx.body = JSON.stringify({code: 200, msg:'发送成功'});
})

//图片转换base64-->图片文件
router.get("/convert", async(ctx)=>{
	//data:image/jpg;base64,
	await DB.count('RLJpgSEX', {RLSEX: new RegExp('data:image')}, 100, 0).then((datas)=>{
		let i = 0;
		for(let k in datas){
			let tmp = datas[k]
			
			let imgExt = 'jpg'
			
			if(tmp.RLSEX.indexOf('image/png')!=-1){
				imgExt = 'png';
			}
			
			let img64 = tmp.RLSEX.replace('data:image/png;base64,', '')
				img64.replace('data:image/jpg;base64,', '')
				img64.replace('data:image/jpeg;base64,', '')
				
			let b = new Buffer(img64, 'base64')
			
			// 修改文件的名称
			var myDate = new Date();
			var newFilename = myDate.getTime()+i.toString()+'.png'
			var uploadPath = path.join(__dirname, '../../static/RLJpgSEXIMG/') + `/${newFilename}`
			var remotefilePath = 'https://www.safe-union.com/wxApp' + '/static/RLJpgSEXIMG/' + newFilename
			
			datas[k].RLSEX = remotefilePath
			
			fs.writeFile(uploadPath, b, (err) => {
			  if (err) throw err;
			  console.log('The file has been saved!')
			});
			
			DB.update('RLJpgSEX', {'id':tmp.id}, {RLSEX:remotefilePath})
			
			i ++
		}
		
		ctx.body = JSON.stringify(datas)
	})
	
})

// 生成成绩查询二维码
router.get('/scoreqr/:number', async ctx => {
    let ids = ctx.params
    let number = parseInt(ids.number)
	
    try {
        let img = qr.image('https://ques.safe-union.com/#/home/?fs=' + number, {size :10});
      
        ctx.type= 'image/png';
        ctx.body = img;
    } catch (e) {
        ctx.type='text/html;charset=utf-8';
        ctx.body='<h1>414 Request-URI Too Large</h1>';
    }

})

//获取配置信息
router.get('/setup/:name', async ctx => { 
	let params = ctx.params
	let name = params.name
	
	let mphone = await DB.find('setup', {name:name});
	
	ctx.body = JSON.stringify(mphone)
})
//修改配置信息
router.post('/setup/modify', async ctx => {
	let body = ctx.request.body
	let name = body.name
	let value = body.value
	
	let original = {name: name}
	let update = {value:value}
	const datas = await DB.update('setup', original, update)
	ctx.body = JSON.stringify({ok:1})
})

module.exports = router