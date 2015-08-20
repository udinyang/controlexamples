'use strict';
if (typeof Levels == 'undefined') var Levels = {};

Levels.StabilizeSinglePendulum = function()
{
	this.name = "StabilizeSinglePendulum";
	this.title = "Inverted Pendulum: Stabilize";
	this.sampleSolution = "function controlFunction(pendulum)\n{\n  return 1000*Math.sin(pendulum.theta)+500*pendulum.dtheta+100*pendulum.x+160*pendulum.dx;\n}";
	this.boilerPlateCode = "function controlFunction(pendulum)\n{\n  return 10*Math.sin(8*pendulum.T);\n}";
	this.description = "Stabilize the pendulum so that it stays upright, moves to the center (x=0) and stays there in perfect balance. Calculate the horizontal force on the cart necessary to achieve this.";		
	this.model = new Models.SinglePendulum({m0: 10,m1: .5,L: 1,g: 9.81,theta: 0.2,dtheta: 0,x: -2,dx: 0,F: 0,T: 0});
}


Levels.StabilizeSinglePendulum.prototype.levelComplete = function()
{
	return Math.abs(this.model.x) < 0.01 
	&& Math.abs(this.model.dx) < 0.01 
	&& Math.abs(this.model.dtheta) < 0.01 
	&& Math.abs(Math.sin(this.model.theta)) < 0.001
	&& Math.cos(this.model.theta) > 0.999;
}


Levels.StabilizeSinglePendulum.prototype.simulate = function (dt, controlFunc)
{
	this.model = this.model.simulate (dt, controlFunc);
}

Levels.StabilizeSinglePendulum.prototype.getSimulationTime = function()	{return this.model.T;}
