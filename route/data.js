exports.coordinatesConvertDegreeMinuteSecond=function (coordinates) {
    // 坐标字符串转数组
    const coords = String(coordinates).split('.');

    // 度  获取数组第一位
    const degree = coords[0];

    // 通过数组第二位进行计算生成数组获取分
    const mArr = String((Number(String(0+'.'+coords[1]))*60)).split('.');
    // 分 获取数组第一位
    const minute = mArr[0];
    // 秒 通过获取数组第二位进行计算生成秒  截取小数点后两位
    // const second = (Number(String(0+'.'+mArr[1]))*60).toFixed(2);

    // 结果
    const result = [degree, minute];

    return result;
}

// CFME
exports.CF= function (FuelType) {
    let CF = 0
    switch (FuelType) {
        case "Diesel":
            CF = 3.206
            break
        case "Gas Oil":
            CF = 3.206
            break
        case "LFO":
            CF = 3.151
            break

        case "HFO":
            CF = 3.114
            break

        case "Propane":
            CF = 3
            break

        case "Butane":
            CF = 3.03
            break

        case "LNG":
            CF = 2.75
            break

        case "Methanol":
            CF = 1.375
            break

        case "Ethanol":
            CF = 1.913
            break
        default:
            CF = 3.114
            break
    }
    return CF
}
// ShipType船类型
// DWT载重吨
// DT载重吨
// LWT 1
// R 容积比==载重吨
// fc_shiptype特殊船舶，先不管
exports.fc= function (ShipType,DWT,LWT,R,fc_shiptype){
    let fc=1.0
    switch(ShipType){
        case "Tanker":
            if (fc_shiptype=="Chemical tankers"){
                if(R<0.98){
                    fc=R**(-0.7)-0.014
                }
            }
            break
        case "Gas carrier":
            if (fc_shiptype=="Gas carriers having direct diesel driven propulsion system"){
                fc=R**(-0.56)
            }
            break
        case "Ro-ro passenger ship":
            if((DWT/LWT)<0.25){
                fc=(DWT/LWT/0.25)**(-0.8)
            }
            else{
                fc=1
            }
            break
        case "Bulk carrier":
            if (R<0.55){
                fc=R**(-0.15)
                break
            }
            else{
                fc=1
            }
            break
        case "Ro-ro cargo ship(vehicle carrier)":
            if((DWT/GT)<0.35){
                fc=((DWT/GT)/0.35)**(-0.8)
            }
            break
        default:
            fc=1.0   
            break        
    } 
    return fc

}

// ShipType船类型
// DWT载重吨
// GT船舶总重
exports.Capacity= function (ShipType, DWT, GT) {
    let Capacity = 0
    switch (ShipType) {
        case "Containership":
            Capacity = 0.7 * DWT
            break
        case "Ro-ro passenger ship":
            Capacity = GT
            break
        case "Cruise passenger ship having non-conventional propulsion":
            Capacity = GT
            break
        default:
            Capacity = DWT
            break
    }
    return Capacity
}

exports.REQCII = function (ShipType,DWT,GT){
    let table={
        "B":[4745,0.622],
        "G":[8104,0.639],
        "T":[5247,0.610],
        "C":[1984 ,0.489],
        "GEN":[588,0.3885],
        "REF":[4600,0.557],
        "COM":[40853 ,0.812],
        "LNG":[9.827,0.000],
        "RO_VE":[5739,0.631],
        "RO_C":[10952,0.637],
        "RO_P":[7540,0.587],
        "CRU":[930,0.383]
    } 
    let a=0
    let b=0
    let c=0
    switch(ShipType){

        case "Bulk carrier":
            if(DWT>=279000){
                b=279000
            }
            else{
                b=DWT
            }
            a=table.B[0]
            c=table.B[1]
           // b=DWT
            break
        case "Gas carrier":
            if(DWT>=65000){
                a=14405*10**7//////////
                c=2.071
            }
            else{
                a=table.G[0]
                c=table.G[1]

            }
            
            b=DWT
            break
        case "Tanker":
            a=table.T[0]
            c=table.T[1]
            b=DWT
            break
        case "Containership":
            a=table.C[0]
            c=table.C[1]
            b=DWT
            break
        case "General cargo ship":
            if(DWT>=20000){
                a=31948
                b=0.792
            }
            else{
                a=table.GEN[0]
                c=table.GEN[1]
            }
           // a=table.GEN[0]
            //c=table.GEN[1]
            b=DWT
            break
        case "Refrigerated cargo carrier":
            a=table.REF[0]
            c=table.REF[1]
            b=DWT   
            break
        case "Combination carrier":
            a=table.COM[0]
            c=table.COM[1]
            b=DWT
            break
        case "LNG carrier":
            if(DWT>=65000&&DWT<=100000){
                a=14479*10**10
                c=2.673
                b=DWT
            }
            else if(DWT<65000){
                a=14479*10**10
                c=2.673
                b=65000
            }
            else{
                a=table.LNG[0]
                c=table.LNG[1]
                b=DWT
            }

            break

        case "Ro-ro cargo ship":
            a=table.RO_C[0]
            c=table.RO_C[1]
            b=DWT
            break
        case "Ro-ro passenger ship":
            a=table.RO_P[0]
            c=table.RO_P[1]
            b=DWT
            break
        case "Cruise passenger ship having non-conventional propulsion":
            a=table.CRU[0]
            c=table.CRU[1]
            b=GT     
            break   
        }   
    return a*(b**(-c))
}

exports.Rating_Director =function (shipType, Capacity, RequiredCII, AttainedCII) {
    let dd_vector = {
        'Bulk carrier':[0.86, 0.94, 1.06, 1.18],
        'Gas carrier': [[0.81,0.91, 1.12, 1.44], [0.85, 0.95, 1.06, 1.25]],
        'Tanker':[0.82, 0.93, 1.08, 1.28],
        'Container ship': [0.83, 0.94, 1.07, 1.19],
        'General cargo ship':[0.83, 0.94, 1.06, 1.19],
        'Refrigerated cargo ship':[0.78, 0.91, 1.07, 1.20],
        'Combination carrier': [0.87, 0.96, 1.06, 1.14],
        'LNG carrier':[[0.89, 0.98, 1.06, 1.13],[0.78, 0.92, 1.10, 1.37]],
        'Ro-ro cargo ship (vehicle carrier)':[0.86, 0.94, 1.06, 1.16],
        'Ro-ro cargo ship':[0.66, 0.90, 1.11, 1.37],
        'Ro-ro passenger ship': [0.72, 0.90, 1.12, 1.41],
        'Cruise passenger ship': [0.87, 0.95, 1.06, 1.16]
    }
    let dd = []
    if (shipType == 'Gas carrier') {
        if (Capacity > 65000) { dd = dd_vector[shipType][0] }
        else { dd = dd_vector[shipType][1] }
    }
    else if (shipType == 'LNG carrier'){
        if (Capacity > 100000) { dd = dd_vector[shipType][0] }
        else { dd = dd_vector[shipType][1] }
    }
    else {
        dd = dd_vector[shipType]
    }
    let rate = 'none'
    let rateList = ['A','B','C','D','E']
    for (let item in dd) {
        let d = dd[item]
        let boudary = d * RequiredCII
        // console.log(AttainedCII,':',boudary)
        // console.log('item',item,'rate:', rateList[item])
        if (AttainedCII < boudary) { 
            rate = rateList[item];
            // console.log('评级：',rate)
            break
        } else if (item < 5)
        {
            let index = Number(item) + 1
            rate = rateList[index]
            // console.log('item',index,'rate:', rateList[index],'评级5：',rate)
        }
        else {
            rate = 'E'
            // console.log('评级else：',rate)
        }
    }
    // console.log(rate)
    return rate
}

exports.boundary = function (shipType, Capacity, RequiredCII, idx) {
    let dd_vector = {
        'Bulk carrier':[0.86, 0.94, 1.06, 1.18],
        'Gas carrier': [[0.81,0.91, 1.12, 1.44], [0.85, 0.95, 1.06, 1.25]],
        'Tanker':[0.82, 0.93, 1.08, 1.28],
        'Container ship': [0.83, 0.94, 1.07, 1.19],
        'General cargo ship':[0.83, 0.94, 1.06, 1.19],
        'Refrigerated cargo ship':[0.78, 0.91, 1.07, 1.20],
        'Combination carrier': [0.87, 0.96, 1.06, 1.14],
        'LNG carrier':[[0.89, 0.98, 1.06, 1.13],[0.78, 0.92, 1.10, 1.37]],
        'Ro-ro cargo ship (vehicle carrier)':[0.86, 0.94, 1.06, 1.16],
        'Ro-ro cargo ship':[0.66, 0.90, 1.11, 1.37],
        'Ro-ro passenger ship': [0.72, 0.90, 1.12, 1.41],
        'Cruise passenger ship': [0.87, 0.95, 1.06, 1.16]
    }
    let dd = 0
    if (shipType == 'Gas carrier') {
        if (Capacity > 65000) { dd = dd_vector[shipType][0][idx] }
        else { dd = dd_vector[shipType][1][idx] }
    }
    else if (shipType == 'LNG carrier'){
        if (Capacity > 100000) { dd = dd_vector[shipType][0][idx] }
        else { dd = dd_vector[shipType][1][idx] }
    }
    else {
        dd = dd_vector[shipType][idx] * RequiredCII
    }
    return dd
}
// W = Capacity * DT载重吨 * 累计里程
// M= FC * 1000000 * CFME * 累计油耗
// AttainedCII= M / W