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