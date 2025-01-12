'use strict';
if (typeof Models === 'undefined') var Models = {};

Models.RocketLanding = function(params)
{
    var nVars = Object.keys(this.vars).length;
    for(var i = 0; i < nVars; i++)
    {
        var key = Object.keys(this.vars)[i];
        this[key] = (typeof params[key] == 'undefined')?this.vars[key]:params[key];
    }
}

Models.RocketLanding.prototype.vars = 
{
    TWR: 2,
    throttle: 1,
    throttle_cmd: 1,
    g: 9.81,
    theta: 0,
    dtheta: 0,
    gimbalAngle: -0.1,
    gimbalAngle_cmd: -0.1,
    Length: 40,
    Width: 2,
    x: 0,
    dx: 0,
    y: 0,
    dy: 0,
    throttleLimit: 0,
    T: 0,
    landingConstraints: {dx:5,dy:5,dtheta:0.1,sinTheta:0.05},
};

Models.RocketLanding.prototype.detectCollision = function ()
{
    var L = this.Length;
    var W = this.Width;
    var s = Math.sin(this.theta);
    var c = Math.cos(this.theta);
    // points relative to the rockets CG that form a convex hull.
    var outerPoints = [{x:0,y:L/2},{x:1.8*W,y:-L/2-W},{x:-1.8*W,y:-L/2-W}];
    for (var i = 0; i < outerPoints.length; i++)
    {
        var p = outerPoints[i];
        if(p.x*s+p.y*c+this.y < 0) return true;
    }
    return false;
}


Models.RocketLanding.prototype.landed = function ()
{
    return this.detectCollision()
        && Math.abs(this.x) < 30
        && Math.abs(this.dx) < this.landingConstraints.dx
        && Math.abs(this.dy) < this.landingConstraints.dy
        && Math.abs(this.dtheta) < this.landingConstraints.dtheta
        && Math.abs(Math.sin(this.theta)) < this.landingConstraints.sinTheta
        && Math.cos(this.theta) > 0;
}

Models.RocketLanding.prototype.crashed = function ()
{
    return this.detectCollision() && !this.landed();
}

Models.RocketLanding.prototype.simulate = function (dt, controlFunc)
{
    if(!this.detectCollision())
    {
        var input = controlFunc({x:this.x,dx:this.dx,y:this.y,dy:this.dy,theta:this.theta,dtheta:this.dtheta,T:this.T}); // call user controller
        if(typeof input != 'object' || typeof input.throttle != 'number' || typeof input.gimbalAngle != 'number') 
            throw "Error: The controlFunction must return an object: {throttle:number, gimbalAngle:number}";
        this.throttle_cmd = Math.max(this.throttleLimit,Math.min(1,input.throttle)); // input limits
        this.gimbalAngle_cmd = Math.max(-.2,Math.min(.2,input.gimbalAngle));
        integrationStep(this, ['x','dx','y','dy','theta','dtheta','throttle','gimbalAngle'], dt);
    }
}

Models.RocketLanding.prototype.ode = function (x)
{
    let currentTWR = this.TWR * x[6];
    let gimbalAngle = x[7];
    return [
        x[1],
        this.g * currentTWR * Math.sin(x[4]+gimbalAngle),
        x[3],
        this.g * (currentTWR * Math.cos(x[4]+gimbalAngle)-1),
        x[5],
        -this.g * currentTWR * 6 / this.Length * Math.sin(gimbalAngle),
        10.0 * (this.throttle_cmd - x[6]),
        10.0 * (this.gimbalAngle_cmd - x[7])
    ];
}


Models.RocketLanding.prototype.draw = function (ctx, canvas)
{
    ctx.scale(0.014,0.014);
    ctx.translate(0,-250);
        
    this.drawRocket(ctx, canvas, -1);
    this.drawGround(ctx, canvas);
    
    if(this.detectCollision())
    {
        ctx.save();
        ctx.scale(1,-1);
        ctx.font="10px Verdana";
        ctx.textAlign="center"; 
        if(this.landed())
        {
            ctx.fillStyle="#009900";
            ctx.fillText("Landed!",0,-80);
        }
        else
        {
            ctx.fillStyle="#990000";
            ctx.fillText("CRASHED!",0,-80);
        }
        ctx.restore();
    }
}

Models.RocketLanding.prototype.drawGround = function (ctx, canvas){
    ctx.strokeStyle="#000055";
    drawLine(ctx,-10000,-1,10000,-1,2);
    for(var x = -30; x <= 30; x+=5)
    {
        drawLine(ctx,x,-1,x,-5,1);
    }
}

Models.RocketLanding.prototype.drawRocket = function (ctx, canvas, i){

    var L = this.Length;
    var W = this.Width;
    ctx.save();
    ctx.translate(this.x,this.y);
    ctx.rotate(-this.theta);
    
    ctx.lineWidth=L/40;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    // exhaust
    ctx.strokeStyle="#FF0000";
    ctx.beginPath();
    ctx.moveTo(W/4,-L/2);
    ctx.lineTo(-3*W*this.throttle*Math.sin(2*this.gimbalAngle),-L/2-3*W*this.throttle*Math.cos(2*this.gimbalAngle));
    ctx.lineTo(-W/4,-L/2);
    ctx.stroke();
    
    // hull
    ctx.strokeStyle="#4444FF";
    ctx.beginPath();
    ctx.moveTo(0,L/2);
    ctx.lineTo(-W/2,L/2-W);
    ctx.lineTo(-W/2,-L/2);
    ctx.lineTo(W/2,-L/2);
    ctx.lineTo(W/2,L/2-W);
    ctx.closePath();
    ctx.stroke();
    
    // left leg
    ctx.beginPath();
    ctx.moveTo(-W/2,-L/2);
    ctx.lineTo(-1.8*W,-L/2-W);
    ctx.lineTo(-W/2,-L/2+W);
    ctx.stroke();
    
    // right leg
    ctx.beginPath();
    ctx.moveTo(W/2,-L/2);
    ctx.lineTo(1.8*W,-L/2-W);
    ctx.lineTo(W/2,-L/2+W);
    ctx.stroke();    
    
    if(i>=0){
        ctx.save();
        ctx.rotate(this.theta);
        ctx.scale(1,-1);
        ctx.font="10px Verdana";
        ctx.textAlign="center"; 
        ctx.fillStyle="#000000";
        ctx.fillText(""+i,0,-40);
        ctx.restore();
    }


    ctx.restore();
}

Models.RocketLanding.prototype.infoText = function ()
{
    return  "/* Horizontal position */ rocket.x      = " + round(this.x,2)
        + "\n/* Horizontal velocity */ rocket.dx     = " + round(this.dx,2)
        + "\n/* Vertical position   */ rocket.y      = " + round(this.y,2)
        + "\n/* Vertical velocity   */ rocket.dy     = " + round(this.dy,2)
        + "\n/* Angle from vertical */ rocket.theta  = " + round(this.theta,2)
        + "\n/* Angular velocity    */ rocket.dtheta = " + round(this.dtheta,2)
        + "\n/* Simulation time     */ rocket.T      = " + round(this.T,2);    
}
