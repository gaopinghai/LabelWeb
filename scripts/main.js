//////////////////////////////////////////////
//                 处理标注结果             //
//////////////////////////////////////////////
function resetDataNewim() {
    image.objects = []
    resetDataNewobj()
}

function resetDataNewobj() {
    color = obj.labelColor
    lab = obj.label
    obj = new Object()
    obj.labelColor = color
    obj.label = lab
}

/*确认标注结果*/
var comfirmBoxBtn = document.getElementById('boxDone')
comfirmBoxBtn.onclick = function() {
    if (!comfirmBox())
    {
        alert('未选择目标区域！')
    }
}

function comfirmBox() {
    if ('w' in obj && obj.w != 0)
    {
        xmin = obj.x
        ymin = obj.y
        xmax = xmin + obj.w
        ymax = ymin + obj.h

        pmin = canXYtoImageXY(image, xmin, ymin)
        obj.xmin = pmin[0]
        obj.ymin = pmin[1]
        pmax = canXYtoImageXY(image, xmax, ymax)
        obj.xmax = pmax[0]
        obj.ymax = pmax[1]
        image.objects.push(obj)
        show_origin_img()
        return true
    }
    return false
}

/*完成标注图片*/
var toJson = document.getElementById('imDone')
toJson.onclick = function() {
    saveObjs()
}

/*保存标注结果*/
function saveObjs() {
    num = image.objects.length
    if (num == 0)
    {
        alert('未进行任何标注')
        return
    }
    var objs = []
    for (i = 0; i < num; i++)
    {
        target = image.objects[i]
        console.log(target.label)
        ob = {
            "label": target.label,
            "xmin": parseInt(target.xmin),
            "xmax": parseInt(target.xmax),
            "ymin": parseInt(target.ymin),
            "ymax": parseInt(target.ymax)
        }
        objs.push(ob)
    }
    imRes = {"imgName": image.name, "objs": objs}
    blob = new Blob([JSON.stringify(imRes)], {type: ""})
    name = image.name.split('.')[0]
    jsonFile = name + '.json'
    saveJson(jsonFile, blob)

    imgInd += 1
    openIndIm()
}

/*保存json文件*/
function saveJson(file, data) {
    //下载为json文件
    var Link = document.createElement('a');
    Link.download = file;
    Link.style.display = 'none';
    // 字符内容转变成blob地址
    Link.href = URL.createObjectURL(data);
    // 触发点击
    document.body.appendChild(Link);
    Link.click();
    // 然后移除
    document.body.removeChild(Link);
}

/*重新标注图片*/
var Imreset = document.getElementById('resetIm')
Imreset.onclick = function() {
    image.objects = []
    show_origin_img()
}

//////////////////////////////////////////////
//                 canvas相关               //
//////////////////////////////////////////////
var canvas = document.querySelector('.Imcanvas');
var canW = canvas.width;
var canH = canvas.height;
var ctx = canvas.getContext('2d');
ctx.lineWidth = 3
flush_canvas()

/////////////////////Bbox 绘制////////////////
var p1=new Object(), p2=new Object(), flag_drawBbox = false
canvas.onmousedown = function(e) {
    if (e.button == 0)
    {
        if (flag_drawBbox == false)
        {
            flag_drawBbox = true
            p1.x = e.offsetX > image.canx ? e.offsetX : image.canx
            p1.x = p1.x < image.canx + image.canw ? p1.x : image.canx + image.canw
            p1.y = e.offsetY > image.cany ? e.offsetY : image.cany
            p1.y = p1.y < image.cany + image.canh ? p1.y : image.cany + image.canw
        }
        else
        {
            flag_drawBbox = false
        }
    }
}
canvas.onmousemove = function(e) {
    if (flag_drawBbox)
    {
        p2.x = e.offsetX > image.canx ? e.offsetX : image.canx
        p2.x = p2.x < image.canx + image.canw ? p2.x : image.canx + image.canw
        p2.y = e.offsetY > image.cany ? e.offsetY : image.cany
        p2.y = p2.y < image.cany + image.canh ? p2.y : image.cany + image.canw
        obj.x = Math.min(p1.x, p2.x)
        obj.y = Math.min(p1.y, p2.y)
        obj.w = Math.abs(p1.x - p2.x)
        obj.h = Math.abs(p1.y - p2.y)
        show_image(image)
        ctx.strokeStyle = obj.labelColor;
        ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
    }
}


////////////////////打开图片//////////////////////////////
var imgName, imgFiles, imgInd
var imgsUploader = document.getElementById('imgSelector')
imgsUploader.onchange = function(e) {
    imgFiles = imgsUploader.files
    imgInd = parseInt(localStorage.getItem('imgInd'))
    if (imgInd == null || !imgFiles.hasOwnProperty(imgInd))
    {
        imgInd = 0
        localStorage.setItem('imgInd', imgInd)
    }
    openIndIm()
}

function openIndIm() {
    if (imgInd < imgFiles.length)
    {
        image.src = imgFiles[imgInd].webkitRelativePath
        image.name = imgFiles[imgInd].name
        resetDataNewim();
        show_origin_img();
        localStorage.setItem('imgInd', imgInd)
    }
    else
    {
        alert('已经处理完所有图片')
        resetDataNewim();
    }
}

let gotoBut = document.getElementById('gotoIm');
gotoBut.onclick = function() {
    imgNameGoto = prompt('请输入图片名')
    for (i = 0; i < imgFiles.length; i++)
    {
        if(imgFiles[i].name == imgNameGoto)
        {
            imgInd = i
            openIndIm()
            resetDataNewim()
            show_origin_img()
            return
        }
    }
    alert('没有找到图片：' + imgNameGoto)
}


/////////////////////图像绘制和放大///////////
var image = new Image()
image.src = 'welcome.jpg'
image.objects = []
image.onload = show_origin_img;
canvas.ondblclick = function(e) {
    e = window.event || event
    enlargeIm(e, image)
};

canvas.oncontextmenu = function(e) {
    e.preventDefault();
}
canvas.onmouseup = function(e) {
    e = window.event || event
    if (e.button == 2)
    {
        show_origin_img()
    }
}

/*双击放大图片*/
function enlargeIm(e, img) {
    e = window.event || event
    mouseX = e.offsetX
    mouseY = e.offsetY
    console.log('canvasX: ' + mouseX + ' canvasY: ' + mouseY)
    if (canXYonImage(mouseX, mouseY))
    {
        imgXY = canXYtoImageXY(img, mouseX, mouseY)
        img.focusX = imgXY[0]
        img.focusY = imgXY[1]
        img.sizek *= 1.5
        // console.log(img.sizek)
        resetDataNewobj()
        show_image(img)
    }
}

/*获取canvas上一个点对应原图像的点*/
function canXYtoImageXY(img, canx, cany) {
    k = 1 / img.sizek
    imgx = (canx - img.canx) * k + img.cutx
    imgy = (cany - img.cany) * k + img.cuty
    return [imgx, imgy]
}

/*图像上的点对应的canvas坐标*/
function imageXYtoCanXY(img, x, y) {
    x = (x - img.cutx) * img.sizek + img.canx
    y = (y - img.cuty) * img.sizek + img.cany
    return [x, y]
}

/*判断点是否在image上*/
function canXYonImage(x, y) {

    if (x > image.canx && x < image.canx + image.canw)
    {
        if (y > image.cany && y < image.cany + image.canh)
        {
            return true
        }
    }
    else
    {
        return false
    }
}

/*在canvas上展示原图片*/
function show_origin_img() {
    flush_canvas()
    imW = image.width
    imH = image.height
    k = canW / imW
    if (imH * k > canH)
    {
        k = canH / imH
    }
    image.sizek = k
    image.focusX = imW / 2
    image.focusY = imH / 2
    
    resetDataNewobj()
    show_image(image)
}

/*涂黑画布*/
function flush_canvas() {
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, canW, canH);
}

/*在canvas上显示已标注目标*/
function show_objects(img) {
    for (i = 0; i < img.objects.length; i++)
    {
        target = img.objects[i]
        x = target.xmin
        y = target.ymin
        xm = target.xmax
        ym = target.ymax

        p = imageXYtoCanXY(img, x, y)
        x = p[0]
        y = p[1]
        p = imageXYtoCanXY(img, xm, ym)
        xm = p[0]
        ym = p[1]
        drwa_line(img, x, y, x, ym, target.labelColor)
        drwa_line(img, x, y, xm, y, target.labelColor)
        drwa_line(img, xm, y, xm, ym, target.labelColor)
        drwa_line(img, x, ym, xm, ym, target.labelColor)
    }
}

/*在canvas的图像上画直线*/
function drwa_line(img, x1, y1, x2, y2, color) {
    if (x1 == x2 && x1 > img.canx && x1 < img.canx + img.canw)
    {
        if (y1 < img.cany)
        {
            y1 = img.cany
        }
        if (y1 > img.cany + img.canh)
        {
            y1 = img.cany + img.canh
        }
        if (y2 < img.cany)
        {
            y2 = img.cany
        }
        if (y2 > img.cany + img.canh)
        {
            y2 = img.cany + img.canh
        }
        ctx.strokeStyle  = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.closePath();
    }
    else {
        if (y1 == y2 && y1 > img.cany && y1 < img.cany + img.canh)
        {
            if (x1 < img.canx)
            {
                x1 = img.canx
            }
            if (x1 > img.canx + img.canw)
            {
                x1 = img.canx + img.canw
            }
            if (x2 < img.canx)
            {
                x2 = img.canx
            }
            if (x2 > img.canx + img.canw)
            {
                x2 = img.canx + img.canw
            }
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            ctx.closePath();
        }
    }
}

/*在canvas上展示图像对应的部分*/
function show_image(img) {
    flush_canvas()
    imgWK = img.width * img.sizek
    imgHK = img.height * img.sizek
    if (canW > imgWK)
    {
        img.cutx = 0
        img.canx = (canW - imgWK) / 2
        img.cutw = img.width
        img.canw = imgWK
    }
    else 
    {
        img.canx = 0
        img.canw = canW
        lenIm = canW / img.sizek
        img.cutw = lenIm
        xl = img.focusX - lenIm / 2
        xr = img.focusX + lenIm / 2
        img.cutx = xl
        if (xl < 0)
        {
            img.cutx = 0
        }
        if (xr >= img.width)
        {
            img.cutx = xl - (xr - img.width + 1)
        }
    }

    if (canH > imgHK)
    {
        img.cuty = 0
        img.cany = (canH - imgHK) / 2
        img.cuth = img.height
        img.canh = imgHK
    }
    else 
    {
        img.cany = 0
        img.canh = canH
        lenIm = canH / img.sizek
        img.cuth = lenIm
        yu = img.focusY - lenIm / 2
        yd = img.focusY + lenIm / 2
        img.cuty = yu
        if (yu < 0)
        {
            img.cuty = 0
        }
        if (yd >= img.height)
        {
            img.cuty = yu - (yd - img.height + 1)
        }
    }
    ctx.drawImage(img, img.cutx, img.cuty, img.cutw, img.cuth, img.canx, img.cany, img.canw, img.canh)
    show_objects(img)
}


//////////////////////////////////////////////
//           手动更改label相关              //
//////////////////////////////////////////////
var obj = new Object();
var inputDBL = $('input[name=label]:checked');
var labelDBL = $('label[for="' + inputDBL.attr('id') + '"]')
obj.label = inputDBL.val();
obj.labelColor = $('label[for="' + inputDBL.attr('id') + '"]').attr('style').split(' ')[1]
var LabelSelector = document.querySelector('.Label')
LabelSelector.onclick = function() {
    inputDBL = $('input[name=label]:checked')
    tmp = inputDBL.val();
    if (tmp == obj.label)
        return
    obj.label = tmp
    obj.labelColor = $('label[for="' + inputDBL.attr('id') + '"]').attr('style').split(' ')[1]
    show_image(image)
    ctx.strokeStyle = obj.labelColor;
    ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
};
LabelSelector.ondblclick = function() {
    inputDBL = $('input[name=label]:checked');
    labelDBL = $('label[for="' + inputDBL.attr('id') + '"]')
    
    inp = prompt('请输入该类的名称')
    if (inp == '' || inp == null)
    {
        console.log('输入为空')
        return
    }
    obj.label = inp
    obj.labelColor = labelDBL.attr('style').split(' ')[1]
    labelDBL.text(obj.label)
    inputDBL.attr('value', obj.label)

    labelID = labelDBL.attr('id')
    localStorage.setItem(labelID, obj.label);
};

//////////////////////////////////////////////
//           加载历史信息                   //
//////////////////////////////////////////////
// let loadBut = document.getElementById('loadLocal');
loadLocalData();
// loadBut.onclick = loadLocalData;

function loadLocalData() {
    console.log('加载历史信息')
    labels = $('label.InputLabel')
    for (i=0, len=labels.length; i < len; i++)
    {
        labeli = labels[i]
        labelID = labeli.id
        name = localStorage.getItem(labelID)
        if (name != 'null') 
        {
            labelI = $('label#' + labelID)
            labelI.text(name)
            inpID = labeli.getAttribute('for')
            inp = $('input#' + inpID)
            inp.attr('value', name)
        }
    }
}
