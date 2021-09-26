
//使用方法
// let volumePillar = new VolumePillar(canvasId,parentId)
// volumePillar._init()
// 默认 每1s内上报20个长度的数值 
// 需定时每1s调用 _setVolumeVal 并赋值20长度音量电平值的数组 [-96,-96,-34,-34,-34,...]
// 注意：调用_setVolumeVal时需dom节点加载完成，。vue可以在$nextTick方法中调用该函数

//当前方式全局，按需首页需放开 尾部的export 
class VolumePillar{
    canvasId:any
    parentId:any
    ctx:any
    volumeValue:Array<number>
    volumeCount:number
    fps:number
    times:number
    timeCount:number
    dbfsMin:number
    lastVolumeVal:number
    splitLine:number
    rafTimes:number|undefined
    backGround:Array<String>|String
    constructor(canvasId:string,parentId:string,backGround?:Array<String>|String,dbfsMin?:number,fps?:number,times?:number,splitLine?:number){
        //ctx对象
        this.ctx = null
        //canvasId
        this.canvasId = canvasId
        //canvas父元素Id
        this.parentId = parentId
        //raf动画的ID,用于注销时使用
        this.rafTimes = undefined
        //需要解析的音量值列表
        this.volumeValue = []
        //音量值计数
        this.volumeCount = 0,
        //帧率 为1s内读取数值的总长度
        this.fps = fps||20
        //数值上报频率/ms
        this.times = times||1000
        //时间计数
        this.timeCount = 0,
        //最小dbfs值
        this.dbfsMin = dbfsMin||-54;
        //如参数为数组则为渐变（三个值），如为字符串则单一颜色值
        this.backGround = backGround||['rgb(0,128,0)','rgb(255,255,0)','rgb(255,0,0)']
        //用于计算缓冲下降的数值
        this.lastVolumeVal = -96
        //分割线个数
        this.splitLine = splitLine||30
        this._init()
    }
    //初始化标签
    _init(){
        let {parentId,canvasId} = this
        var myCanvas = document.createElement("canvas");
        var canvasArea = document.getElementById(parentId)
        let canvasHeight = canvasArea.offsetHeight
        let canvasWidth = canvasArea.offsetWidth
        myCanvas.setAttribute("height", canvasHeight.toString());
        myCanvas.setAttribute("width", canvasWidth.toString());
        myCanvas.setAttribute("id", canvasId);
        myCanvas.style.position = "absolute";
        canvasArea.style.position = "relative";
        canvasArea.appendChild(myCanvas);


        this._initCanvas(myCanvas,canvasArea)
        this._drawMusic()
        window.addEventListener("resize", resizeCanvas, false);

        function resizeCanvas() {
            myCanvas.width = canvasArea.offsetWidth
            myCanvas.height = canvasArea.offsetHeight
            this._initCanvas(myCanvas)
        }
    }
    //画canvas画布
    _initCanvas(myCanvas,canvasArea){
        let {backGround,splitLine} = this
        var ctx = myCanvas.getContext("2d");
        // 添加渐变
        // let g = ctx.createLinearGradient(0, 0, canvasArea.offsetWidth, 0);
        // g.addColorStop(0, "rgb(0,128,0)");
        // g.addColorStop(0.5, "rgb(255,255,0)");
        // g.addColorStop(1, "rgb(255,0,0)");
        // ctx.beginPath()
        // ctx.fillStyle = g;
        // ctx.fillRect(0, 0, canvasArea.offsetWidth, canvasArea.offsetHeight);
        // ctx.closePath()

        if(Array.isArray(backGround)){
            //渐变
            let g = ctx.createLinearGradient(0, 0, canvasArea.offsetWidth, 0);
            g.addColorStop(0, backGround[0]);
            g.addColorStop(0.5, backGround[1]);
            g.addColorStop(1, backGround[2]);
            ctx.beginPath()
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, canvasArea.offsetWidth, canvasArea.offsetHeight);
            ctx.closePath()
        }else{
            ctx.fillStyle = backGround;
        }
        
        //画分割线
        ctx.beginPath();
        for(let i=0;i<splitLine;i++){
            ctx.moveTo(canvasArea.offsetWidth/splitLine*i,0);
            ctx.lineTo(canvasArea.offsetWidth/splitLine*i,canvasArea.offsetHeight);
        }
        ctx.lineWidth = canvasArea.offsetWidth/splitLine/5;
        ctx.stroke();
        this.ctx = ctx
    }
    //监听音量值变化进行画布绘制（定时），根据帧率控制 、
    // 次数为   1000/fps  1s内执行的次数
    _drawMusic() {
        let {ctx,parentId,fps,splitLine} = this
        var canvasArea = document.getElementById(parentId)
        let self = this
        let randomPick;
        let random
        // let prevValue = 0
        //帧率控制
        var fpsInterval = 1000 / fps
        var last = new Date().getTime() //上次执行的时刻
        var refreshAnimation = function() {
            
            //重复动画
            self.rafTimes = window.requestAnimationFrame(refreshAnimation);
            function setVolumeVal(){
                ctx.clearRect(0, 0, canvasArea.offsetWidth, canvasArea.offsetHeight);
                random = self.volumeValue[self.volumeCount]
                self.volumeCount++
                randomPick = randomPick || random

                if (randomPick < random) {
                    randomPick = random
                } else if (randomPick > 2) {
                    randomPick -= 1
                } else if (randomPick <= 2) {
                    randomPick = 0.5;
                }

                //画音量值
                ctx.fillRect(0, 0, random, canvasArea.offsetHeight);
                //画刻度线
                ctx.beginPath();
                for(let i=0;i<splitLine;i++){
                    ctx.moveTo(canvasArea.offsetWidth/splitLine*i,0);
                    ctx.lineTo(canvasArea.offsetWidth/splitLine*i,canvasArea.offsetHeight);
                }
                ctx.lineWidth = canvasArea.offsetWidth/splitLine/5;
                ctx.stroke();
                //画刻度值
                ctx.fillRect(randomPick,0 ,5, canvasArea.offsetHeight);
            }
            // 执行时的时间
            var now = new Date().getTime()
            var elapsed = now - last;
            // 经过了足够的时间
            if (elapsed > fpsInterval) {
                last = now - (elapsed % fpsInterval); //校正当前时间

                // 循环的代码
                setVolumeVal()
            }
            
        }
        refreshAnimation();
    }
    //设置音量值,向valumeVal数组
    _setVolumeVal(volumeValue:Array<number>){
        let {times,parentId,dbfsMin} = this
        var canvasArea = document.getElementById(parentId)
        let width = canvasArea.offsetWidth
        //计算电平值在画布中的比例
        volumeValue = volumeValue.map(volume=>{
            //音量值递减
            !this.lastVolumeVal&&(this.lastVolumeVal = volume)
            if(this.lastVolumeVal > volume){
                //递减值
                volume = this.lastVolumeVal - 1
            }
            this.lastVolumeVal = volume 
            return width/100 * ((100/dbfsMin*-1)*(dbfsMin*-1+volume))
        })
        // this.volumeValue = volumeValue
        this.timeCount++
        //计算1s内数值
        if(1000/times==this.timeCount){
            this.timeCount = 0
            this.volumeCount = 0
            this.volumeValue = []
        }
        this.volumeValue.push(...volumeValue); 
    }
    destroyRaf() {
        this.rafTimes&&cancelAnimationFrame(this.rafTimes)
    }
}
// export default VolumePillar