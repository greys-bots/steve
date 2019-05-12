/*

Steve Bot Version 1.0 Official (HEROKU)
Begin work date: 07 September, 2017
Coders on it: Kam, Jeff, Lucio

TODO:
- edit emojis with a command
- change nickname
- autoroles (given when member joins)
- menus to other things, like triggers, notes, and mod commands

---------------------------------------------------------------------------------------------
*/

const Discord= require('discord.js');
const {Client} = require('pg');
const client = new Client({
	connectionString: "postgres://ogyymyxoslptjw:5acd154e02cf409b2c17a7a9a3938afd3a8f7a090c4d0f18bbff4500fe8af063@ec2-23-23-220-19.compute-1.amazonaws.com:5432/d833aj2cp8fb1l",
	ssl:true,
});
const bot= new Discord.Client();
const config= require('./config.json');
const Texts= require('./strings.json');
const fs=require("fs");
const sql=require('sqlite');
const pimg=require('pngjs-image');
const sharp=require('sharp');
const creator_id="248290631640678400";


//sql.open("./data.sqlite");

const helpEmbed={
	"title":"COMMANDS",
	"description":"A handy list of commands for you~",
	"color":16755455,
	"fields":[
		{"name":"**Affirming**",
			"value":"`I love you` - If you tell me you love me, I'll let you know that I love you too!\n"+
			"`Am I real?` - Of course you are, and I'll tell you just that.\n"+
			"`Lovebomb` - I'll tell you some mushy things that everyone deserves to hear."
		},
		{"name":"**Practical**",
			"value":"`Notes` - This one is complicated. Use heysteve notes help to get help for it.\n"+
			"`Role` - Syntax: heysteve role [add/remove] [role|name]. Use heysteve role by itself to get more details.\n"+
			"`Trigs` - This command is a bit complicated, so it's best to just type heysteve trigs in order to get the information on it.\n"+
			"`Profile` - Syntax: heysteve profile [@person]. Using heysteve profile alone will offer a menu to edit your profile.\n"+
			"`Resources` - This one comes with a handy menu! Just type heysteve resources to use it.\n"+
			"`Feedback` - This command sends feedback to the dev. Usage: heysteve feedback [message]"
		},
		{"name":"**Fun**",
			"value":"`Daily` - Used to get the daily 200 bucks. And then some.\n"+
			"`Bank` - Used to see what you've collected thus far.\n"+
			"`Flip` - I'll flip a coin.\n"+
			"`Random` - I'll generate a random number between 0 and what you put in.\n"+
			"`Extra` - You're gay/I'm gay/you're cute/you're adorable/vore/oof"
		},
	]
}

const adHelpEmbed={
	"title":"COMMANDS",
	"description":"A handy list of commands for you~",
	"color":16755455,
	"fields":[
		{"name":"\u200B","value":"\u200B"},
		{"name":"*Role*","value":"Add, remove, etc roles.\n**sub-args:** init, add, remove, edit (color and name), new, delete"},
		{"name":"*Strikes*","value":"Edit a person's strike count.\n**sub-args:** add, remove, set"},
		{"name":"*Bundles*","value":"Edit role bundles for the server.\n**sub-args:** new, delete, add, remove"},
		{"name":"*Welcome*","value":"Give users set welcome roles and display a set welcome message!\n**usage:** heysteve * welcome [@ user]"},
		{"name":"*Edit*","value":"Enable/disable mod commands, etc.\n**sub-args**: mod (1 or 0), welcome (1 or 0 for en/disable, message, channel, roles)"},
		{"name":"*Enable*","value":"Enable commads that have been disabled. Send without arguments for a list of all useable commands."},
		{"name":"*Disable*","value":"Disable commands. Send without arguments for a list of all useable commands."},
		{"name":"*Init*","value":"Initiate roles for self-rolablility. Argument 1 is the role name, argument 2 is a 1 for self-rolable and 0 for only mod-rolable."},
		{"name":"*Promote*","value":"Promote users to bot admins in the server. Works internally, without roles"},
		{"name":"*Demote*","value":"Gave a user too much Steve power? That's okay, use this to nerf 'em"},
		{"name":"*Emoji*","value":"Remotely add or remove emoji.\n**sub-args:** add, delete"}

	]
}

function hex2rgb(hex){
	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

//LOG IN
bot.login(config.token);

//LET US KNOW YOU'RE WORKING
bot.on('ready', () => {
	bot.user.setStatus("idle");
	console.log('Preparing...');
	setTimeout(() => { bot.user.setStatus("online"); console.log('Ready.');  }, 5000);
	client.connect();
});

function dailyReset(){
	client.query(`SELECT * FROM configs WHERE servname='bank_master'`).then((banker)=>{
		var today=new Date();
		if((today.getMonth()+"/"+today.getDate())==banker.rows[0].moderation){
			return;
		} else {
			client.query(`UPDATE profiles SET daily='0'`);
			client.query(`UPDATE configs SET moderation='${today.getMonth()}/${today.getDate()}' WHERE servname='bank_master'`)
			console.log("Dailies reset at "+today.getTime())
		}
	})
}

bot.on("guildMemberAdd", (member) => {
	var confs={};
	var serva=member.guild.id;

	confs[serva]={};
	confs[serva].mod_e=false;
	confs[serva].welc_e=false;
	confs[serva].welc_msg="";
	confs[serva].ban_e=false;
	confs[serva].ban_msg="";

	function setupConfigs(server_name){

		client.query(`SELECT * FROM configs WHERE servname='${server_name}'`).then(serv=>{
			serv=serv.rows[0];
			var welcvals=serv.welcome_msg.split("---");

			if(welcvals[0]=="1"){
				confs[server_name].welc_e=true;
				confs[server_name].welc_msg=welcvals[1];
				confs[server_name].welc_chan=welcvals[2];
			} else {
				confs[server_name].welc_e=false;
				confs[server_name].welc_chan=welcvals[2];
			}

		}).catch(()=>{
			client.query(`CREATE TABLE IF NOT EXISTS configs (servname TEXT,moderation TEXT,welcome_msg TEXT,ban_msg TEXT,welcome_roles TEXT,disabled TEXT,autoroles TEXT)`).then(()=> {
				client.query(`SELECT * FROM configs WHERE servname='${serva}'`).then(table=>{
					table=table.rows[0];
					if(table){
						return
					} else {
						client.query(`INSERT INTO configs (servname,moderation,welcome_msg,ban_msg,welcome_roles,disabled,autoroles) VALUES ($1,$2,$3,$4,$5,$6)`,[serva,"1","0---unset---general","0---unset","0---unset---unset","",""]);
					}
				})
			});
				//msg.channel.send("Setup Config done")
			});


	};

	function toLit(str,torep,repwith){
		if(str.indexOf(torep)!==-1){
			var repd=str.replace(torep,repwith);
			return eval('`'+repd+'`')
		} else {
			console.log("Nothing to replace.")
			return eval('`'+str+'`')
		}

	};

	setupConfigs(serva);
	setTimeout(function(){
		if(confs[serva].welc_e&&confs[serva].welc_msg!=="unset"&&confs[serva].welc_chan!=="unset"){
			var ch=member.guild.channels.find(c => c.name == confs[serva].welc_chan);
			if(ch){
				ch.send(toLit(toLit(toLit(confs[serva].welc_msg,"$member_name","${member.user.username}"),"$server","${member.guild.name}"),"$member_id","${member.user.id}"))
			} else if(!ch){
				console.log(`Error with welcome message in server ${serva}: Channel ${confs[serva].welc_chan} not found`)
			}
		}
	},500)
});

bot.on('message',(msg) =>{

	var gaye=bot.emojis.find(e => e.name =="gay")
	var validemo=bot.emojis.find(e => e.name == "valid")
	var vaemo=bot.emojis.find(e => e.name == "va")
	var lidemo=bot.emojis.find(e => e.name == "lid")
	var hye=bot.emojis.find(e => e.name == "hypereyes")

	var confs={};
	var use={};
	var command;
	var args=[];
	var args2=[];
	var rnames=[];
	var bnames=[];
	var rnvals=[];
	var bnvals=[];
	var cont=[];


	function toLit(str,torep,repwith){
		if(str.indexOf(torep)!==-1){
			var repd=str.replace(torep,repwith);
			return eval('`'+repd+'`')
		} else {
			return str
		}

	};

	function genCode(num){
		var codestring=""
		var codenum=0
		while (codenum<(num==undefined ? 4 : num)){
			codestring=codestring+Texts.codestab[Math.floor(Math.random() * (Texts.codestab.length))]
			codenum=codenum+1
		}
		return codestring;
	}

	function randomText(table){
		var r=Math.floor(Math.random() * table.length);
		return table[r];
	}

	function setupProfile(m){
			client.query(`SELECT * FROM profiles WHERE user_id='${m.author.id}'`).then(res=>{
				if(res.rows[0]){
					console.log("Profile set up correctly")
					return
				} else {
					console.log(`Added profile for ${m.author.username}`)
					client.query(`INSERT INTO profiles (user_id,ct,bio,level,exp,money,daily) VALUES ($1,$2,$3,$4,$5,$6,$7)`,[m.author.id,"not set","not set",1,0,5000,0]);
				}

			})
	};

	function setupFeedback(){
		client.query(`CREATE TABLE IF NOT EXISTS feedback (user_id TEXT, ticket TEXT, channel_id TEXT, msg TEXT)`)
	}

	function dmStuff(m){
		if(m.content.toLowerCase().startsWith(config.prefix)){
			cont=m.content.split(" ");
			if(cont[1]!=undefined){
				command=cont[1].toLowerCase();
				args=m.content.toLowerCase().split(" ").slice(2);
				args2=m.content.split(" ").slice(2);
				console.log(msg.content)
			} else {
				m.author.send("That's me!")
				return;
			}
		};

		if(command!=undefined){
			switch(command){
				//*******************************************************This is the thing VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVv**********************************************
				case "reply":
					if(config.accepted_ids.includes(m.author.id)){
						let tick=args[0];
						let frmsg=m.content.split(" ").slice(3);
						client.query(`SELECT * FROM feedback WHERE ticket='${tick}'`,(err,res)=>{
							if(err){
								return console.log(err)
							}
							let ftick=res.rows[0];
							if(ftick){
								let embed=new Discord.RichEmbed();
								embed.setAuthor(m.author.tag)
								embed.addField("Original",ftick.msg)
								embed.addField("Reply",frmsg)
								bot.channels.find(c => c.id == ftick.channel_id).send(`${bot.users.find(m => m.id == ftick.user_id)}`,{embed})
								client.query(`DELETE FROM feedback WHERE ticket='${tick}'`)
							} else {
								m.channel.send("No ticket with that ID was found.")
							}
						})
					} else {
						m.channel.send("ERROR: You do not have permission to use that command.")
					}
					break;

				case "vore":
					msg.channel.send(randomText(Texts.vore));
					break;
				case "oof":
					msg.channel.send(randomText(Texts.oof));
					break;
				case "fool":
					let ft=randomText(Texts.fool)
					if(ft==":hypereyes:"){
						return msg.channel.send(`${hye}`)
					} else {
						return msg.channel.send(ft)
					}
					break;
				case "gay":
					break;
				case "valid":
					var vt=randomText(Texts.valid)
					if(vt==":va::lid:"){
						return msg.channel.send(`${vaemo}${lidemo}`)
					} else if(vt==":valid:"){
						return msg.channel.send(`${validemo}`)
					}else {
						return msg.channel.send(vt)
					}
					break;
				case "yikes":
				msg.channel.send(`:regional_indicator_y: :regional_indicator_i: :regional_indicator_k: :regional_indicator_e: :regional_indicator_s:`)
					break;
				case "emojify":
				msg.channel.startTyping();
				msg.channel.send("Generating...")


				var words=[];
				for(var x=0;x<args.length;x++){
					var chars=args[x].split("");
					var emotes=[];
					for(var n=0;n<chars.length;n++){
						if(/[a-z]/.test(chars[n])){
							emotes.push(`:regional_indicator_${chars[n]}:`)
						} else if(chars[n]=="?"){
							emotes.push(":question:")
						} else if(chars[n]=="!"){
							emotes.push(":exclamation:")
						}

					}
					if(emotes.length>1){
						words.push(emotes.join(" "));
					} else {
						words.push(emotes)
					}

				}
				setTimeout(function(){
					if(words.length>1){
						msg.channel.send(words.join("\n"))
						msg.channel.stopTyping();
					} else {
						msg.channel.send(words);
						msg.channel.stopTyping();
					}
				},750);
				break;
				case "help":
				m.author.send(Texts.dmhelp);
				break;
				case "flip":
				var num=Math.floor(Math.random() * 2);
				if(num==1){
					msg.channel.send("You flipped:\n:o:\nHeads!")
				} else {
					msg.channel.send("You flipped:\n:x:\nTails!")
				}
				break;

				case "random":
				if(args[0]!=undefined){
					if(!isNaN(args[0])){
						var max=args[0];
						var num=Math.floor(Math.random() * max);
						var nums=num.toString().split("");
						var done="";
						for(var x=0;x<nums.length;x++){
							nums[x]=":"+Texts.numbers[eval(nums[x])]+":";
						}
						msg.channel.send("Generating...");
						done=nums.join("");
						setTimeout(function(){msg.channel.send("Your number:\n"+done)},1000);
					} else {
						msg.channel.send("That's not a number!")
					}

				} else {
					return msg.channel.send("Please give a maximum number.")
				}
				break;

				case "you":
				if(args[0]=="are"){
					switch(args[1]){
						case "gay":
						msg.channel.send("Yes. Yes I am. We all are. Thank you for noticing :purple_heart:");
						break;
						case "adorable":
						msg.channel.send("D'aww, thank you so much! You're adorable, too :purple_heart:");
						break;
						case "cute":
						msg.channel.send("Oh, I'm not so sure about that... But you're definitely cute! :purple_heart:")
						break;
						default:
						msg.channel.send("I'm what now?");
						break;
					}
				} else {
					msg.channel.send("Hmm?");
				}
				break;
				case "you're":
				switch(args[0]){
					case "gay":
					msg.channel.send("Yes. Yes I am. We all are. Thank you for noticing :purple_heart:");
					break;
					case "adorable":
					msg.channel.send("D'aww, thank you so much! You're adorable, too :purple_heart:");
					break;
					case "cute":
					msg.channel.send("Oh, I'm not so sure about that... But you're definitely cute! :purple_heart:")
					break;
					default:
					msg.channel.send("I'm what now?");
					break;
				}
				break;

				case "good":
				if(args[0]=="night"){
					msg.channel.send(`Goodnight, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}. Sweet dreams and sleep well :purple_heart:`);
				} else if(args[0]=="morning") {
					msg.channel.send(`Good morning, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}! I hope you're having a good day so far :)`)
				}
				break;

				case "trigs":

				if(args[0]=="view"&&(args[1]!=undefined)){
						client.query(`SELECT * FROM triggers WHERE user_id='${args[1]}'`).then(tuy=>{
							tuy=tuy.rows[0];
							if(tuy){
								var embed=new Discord.RichEmbed();
								embed.setTitle(`${tuy.name}`)
								embed.setDescription("---")
								embed.addField("**BAD**",`${tuy.bad}`);
								embed.addField("**OKAY**",`${tuy.okay}`);
								embed.addField("**WARN**",`${tuy.warn}`);
								embed.setColor("#FF5050")
								msg.channel.send({embed}).catch(error=>{
									if(error){
										msg.channel.send(`${tuy.name}\n\n**BAD**\n${tuy.bad}\n\n**OKAY**\n${tuy.okay}\n\n**WARN**\n${tuy.warn}`)
									}
								});
							} else {
								msg.channel.send("You have not registered any triggers under this code.")
							}
						});

					return;
				} else if(args[0]=="reset"&&args[1]!=undefined){
					var isyours=false;

					client.query(`SELECT * FROM profiles WHERE user_id='${msg.author.id}'`).then(gath=>{
						gath=gath.rows[0];
						if(gath.tc!="none"){
							if(gath.tc.indexOf(args[1])!==-1){
								isyours=true
							}
						}
					});

					setTimeout(function(){if(!isyours){
						msg.channel.send("That code does not exist or does not belong to you.")
						return;
					} else {
						client.query(`UPDATE triggers SET bad='none',warn='none',okay='none' WHERE user_id='${args[1]}'`)
						msg.channel.send("Triggers reset.")
						return;
					}
				},400)
				return;
				} else if(args[0]=="new"){
					if(args[1]!=undefined){
						var ae=true;
						var code=genCode();
							client.query(`SELECT * FROM triggers WHERE user_id='${code}'`).then(gtc=>{
								gtc=gtc.rows[0];
									if(gtc){
										msg.channel.send(code)
										code=genCode();
									} else {
										ae=false;
									}
							})
						client.query(`SELECT * FROM profiles WHERE user_id='${msg.author.id}'`).then(gtr=>{
							gtr=gtr.rows[0];
							if(gtr.tc!="none"){
								var cd=gtr.tc.split(";;");
								for(x=0;x<cd.length;x++){
									var cd2=cd[x].split(":");
									if(args[1]==cd2[0]){
										msg.channel.send(`Trigger set already created for ${args[0]}`);
										return;
									}
								}

								client.query(`UPDATE profiles SET tc='${gtr.tc}${args[1]}:${code};;' WHERE user_id='${msg.author.id}'`);
								client.query(`INSERT INTO triggers (user_id,bad,okay,warn,name) VALUES ($1,$2,$3,$4,$5)`,[code,"none","none","none",args[1]]).then(()=>{
									msg.channel.send(`Created new trigger set. Code: ${code}`);
								});


							} else {
								client.query(`UPDATE profiles SET tc='${args[1]}:${code};;' WHERE user_id='${msg.author.id}'`);
								client.query(`INSERT INTO triggers (user_id,bad,okay,warn) VALUES ($1,$2,$3,$4)`,[code,"none","none","none"]).then(()=>{
									msg.channel.send(`Created new trigger set. Code: ${code}`);
								});
							}

						})
					} else {
						msg.channel.send("Please provide a name for the trigger set.")
					}
					return;
				} else if(args[0]=="delete" && args[1]!=undefined){
					var avc=[];
					var rtrig="";
					var eb=[];
					client.query(`SELECT * FROM profiles WHERE user_id='${msg.author.id}'`).then(utd=>{
						utd=utd.rows[0];
						if(utd.tc!="none"){
							if(utd.tc.indexOf(args[1])!==-1){
								var tabs=utd.tc.split(";;");
								for(var ind=0;ind<=tabs.length;ind++){
									if(tabs[ind]!=undefined){
										var g=tabs[ind].split(":");
										if(args[1]!=g[1]){
											eb.push(tabs[ind])
										}
									}
								}
								setTimeout(function(){
									if(eb.join("").length<2){
										rtrig="none"
									} else {
										rtrig=eb.join(";;");
									}

									client.query(`UPDATE profiles SET tc='${rtrig}' WHERE user_id='${msg.author.id}'`)
									client.query(`DELETE FROM triggers WHERE user_id='${args[1]}'`).then(()=>{
										msg.channel.send("Config deleted.")
									})
								},500)
							} else {
								return msg.channel.send("That config does not exist or does not belong to you.")
							}
						} else {
							return msg.channel.send("Nothing to delete.")
						}
					})
					return;
				}

				if(args[0]==undefined||(args[1]==undefined&&(args[0]!="new"))){
					return msg.channel.send(Texts.trigshelp)
				}

				var isyours=false;

				client.query(`SELECT * FROM profiles WHERE user_id='${msg.author.id}'`).then(gath=>{
					gath=gath.rows[0];
					if(gath.tc!="none"){
						var avc=gath.tc.split(";;");
						for(var acounter=0;acounter<=avc.length;acounter++){
							if(avc[acounter]!=undefined){
								var geh=avc[acounter].split(":");
								if(args[1]==geh[1]){
									isyours=true;
								}
							}
						}
					}

				});

				var t=args2[2].split(",");
				var allb=[];
				var allo=[];
				var allw=[];
				var b;
				var o;
				var w;




				setTimeout(function(){
					if(isyours){
					switch(args[0]){
					case "add":
					for(var e=0;e<t.length;e++){

						var spl=t[e].split("-");
						var ta=spl[0];
						var tr=ta.split("|").join(" ");

						switch(spl[1]){
							case "b":
							allb.push(tr.replace("_","-"));
							break;
							case "o":
							allo.push(tr.replace("_","-"));
							break;
							case "w":
							allw.push(tr.replace("_","-"));
							break;
							default:
							allw.push(tr.replace("_","-"));
							break;
						}
					}
					if(allb.length<1){
						b="none";
					} else {
						b=allb.join(", ");
					}
					if(allo.length<1){
						o="none";
					} else {
						o=allo.join(", ");
					}
					if(allw.length<1){
						w="none";
					} else {
						w=allw.join(", ");
					}

					client.query(`SELECT * FROM triggers WHERE user_id='${args[1]}'`).then(trow=>{
						trow=trow.rows[0];
						if(trow){
							if(trow.okay=="none"&&(o!="none"||o=="none")){
								client.query(`UPDATE triggers SET okay='${o}' WHERE user_id='${args[1]}'`);
							} else if(trow.okay!="none"&&o=="none") {
								client.query(`UPDATE triggers SET okay='${trow.okay}' WHERE user_id='${args[1]}'`);
							} else {
								client.query(`UPDATE triggers SET okay='${trow.okay}, ${o}' WHERE user_id='${args[1]}'`);
							}

							if(trow.warn=="none"&&(w!="none"||w=="none")){
								client.query(`UPDATE triggers SET warn='${w}' WHERE user_id='${args[1]}'`);
							} else if(trow.warn!="none"&&w=="none") {
								client.query(`UPDATE triggers SET warn='${trow.warn}' WHERE user_id='${args[1]}'`);
							} else {
								client.query(`UPDATE triggers SET warn='${trow.warn}, ${w}' WHERE user_id='${args[1]}'`);
							}

							if(trow.bad=="none"&&(b!="none"||b=="none")){
								client.query(`UPDATE triggers SET bad='${b}' WHERE user_id='${args[1]}'`);
							} else if(trow.bad!="none"&&b=="none") {
								client.query(`UPDATE triggers SET bad='${trow.bad}' WHERE user_id='${args[1]}'`);
							} else {
								client.query(`UPDATE triggers SET bad='${trow.bad}, ${b}' WHERE user_id='${args[1]}'`);
							}

							msg.channel.send("Trigger list has been updated.")

						} else {
							client.query(`INSERT INTO triggers (user_id,bad,okay,warn) VALUES ($1,$2,$3,$4)`,[args[1],b,o,w]).then(()=>{
								msg.channel.send(`Trigger list has been updated.`);
							});
						}
					})

					break;
					case "remove":
					var fb;
					var fo;
					var fw;
					client.query(`SELECT * FROM triggers WHERE user_id='${args[1]}'`).then(gott=>{
						gott=gott.rows[0];
						if(gott){
							if(gott.bad!="none"||gott.okay!="none"||gott.warn!="none"){

								b=gott.bad.split(", ");
								o=gott.okay.split(", ");
								w=gott.warn.split(", ");

								for(var e=0;e<t.length;e++){

									var trig=t[e].split("|").join(" ");
									var bi=b.indexOf(trig.replace("_","-"));
									var oi=o.indexOf(trig.replace("_","-"));
									var wi=w.indexOf(trig.replace("_","-"));

									if(wi!== -1){
										w.splice(wi,1);
									}

									if(oi!== -1){
										o.splice(oi,1);
									}

									if(bi!== -1){
										b.splice(bi,1);
									}

								}

								setTimeout(function(){

									if(b.length<1){
										fb="none";
									} else {
										fb=b.join(", ");
									}

									if(o.length<1){
										fo="none";
									} else {
										fo=o.join(", ");
									}

									if(w.length<1){
										fw="none";
									} else {
										fw=w.join(", ");
									}

									client.query(`UPDATE triggers SET okay='${fo}' WHERE user_id='${args[1]}'`);
									client.query(`UPDATE triggers SET warn='${fw}' WHERE user_id='${args[1]}'`);
									client.query(`UPDATE triggers SET bad='${fb}' WHERE user_id='${args[1]}'`);

									msg.channel.send("Triggers have been updated.");

								},1000)

							} else {
								msg.channel.send("You cannot remove triggers, because you have not indexed any.")
							}

						} else {
							msg.channel.send("You cannot remove triggers, because you have not indexed any.")
						}
					});
					break;
					case "set":
					for(var e=0;e<t.length;e++){

						var spl=t[e].split("-");
						var ta=spl[0];
						var tr=ta.split("|").join(" ");

						switch(spl[1]){
							case "b":
							allb.push(tr.replace("_","-"));
							break;
							case "o":
							allo.push(tr.replace("_","-"));
							break;
							case "w":
							allw.push(tr.replace("_","-"));
							break;
							default:
							allw.push(tr.replace("_","-"));
							break;
						}
					}
					if(allb.length<1){
						b="none";
					} else {
						b=allb.join(", ");
					}
					if(allo.length<1){
						o="none";
					} else {
						o=allo.join(", ");
					}
					if(allw.length<1){
						w="none";
					} else {
						w=allw.join(", ");
					}

					client.query(`SELECT * FROM triggers WHERE user_id='${args[1]}'`).then(trow=>{
						trow=trow.rows[0];
						if(trow){
							client.query(`UPDATE triggers SET okay='${o}' WHERE user_id='${args[1]}'`);
							client.query(`UPDATE triggers SET warn='${w}' WHERE user_id='${args[1]}'`);
							client.query(`UPDATE triggers SET bad='${b}' WHERE user_id='${args[1]}'`).then(()=>{
								msg.channel.send(`Trigger list has been set.`);
							});
						} else {
							msg.channel.send("Trigger set does not exist.")
						}
					})
					break;
					default:
					msg.channel.send(Texts.trigshelp)
					break;

					}
				}else{
						msg.channel.send("That code does not exist or does not belong to you.")
					}
			},500)

				break;

				case "daily":
				client.query(`SELECT * FROM profiles WHERE user_id=${m.author.id}`).then(usergot=>{
					usergot=usergot.rows[0];
					if(usergot.daily=="0"){
						client.query(`UPDATE profiles SET money=${usergot.money}+200 WHERE user_id=${m.author.id}`).then(()=>{
							client.query(`UPDATE profiles SET daily='1' WHERE user_id=${m.author.id}`).then(()=>{
								m.author.send(`${m.author.username}, you've received 200 bucks for today!`)
							})
						})
					} else if(usergot.daily=="1"){
						client.query(`UPDATE profiles SET money=${usergot.money}+150 WHERE user_id=${m.author.id}`).then(()=>{
							client.query(`UPDATE profiles SET daily='2' WHERE user_id=${m.author.id}`).then(()=>{
								m.author.send(`${m.author.username}, I can't give you much, but... Here's another 150! :)`)
							})
						})
					} else if(usergot.daily=="2"){
						client.query(`UPDATE profiles SET money=${usergot.money}+50 WHERE user_id=${m.author.id}`).then(()=>{
							client.query(`UPDATE profiles SET daily='3' WHERE user_id=${m.author.id}`).then(()=>{
								m.author.send(`${m.author.username}, um, well, you've gotten a daily twice today... But here, I can give 50 to you :D`)
							})
						})
					} else {
						m.author.send(`Sorry, ${m.author.username}, I can't give you anymore money... It's against the rules :disappointed:`);
					}
				});
				break;

				case "bank":
				client.query(`SELECT * FROM profiles WHERE user_id=${m.author.id}`).then(useg=>{
					useg=useg.rows[0];
					m.author.send(`${m.author.username}, you have ${useg.money} bucks!`);
				});
				break;

				case "what's":
				if(args[0]=="up"||args[0]=="up?"){
					msg.channel.send(randomText(Texts.wass));

				} else {
					msg.channel.send("Hmm?")
				}
				break;
				case "whats":
				if(args[0]=="up"||args[0]=="up?"){

					msg.channel.send(randomText(Texts.wass));

				} else {
					msg.channel.send("Hmm?")
				}
				break;

				case "lovebomb":
				var lb=0;
				setInterval(() => {
					if(lb==5){
						clearInterval();
					} else {
						m.author.send(toLit(Texts.lovebombs[lb],"msg.author.username","${msg.author.username}"));
						lb=lb+1;
					}
				},1000);
				break;
				case "am":
				if(args[0]=="i"&&(args[1]=="real"||args[1]=="real?")){
					msg.channel.send("You are more than definitely real. Nothing you're going through is fake.\nDon't take the words that others say with much substance. They don't know you.\nOnly you know you.\nYou deserve better, and you are definitely real.")
				}
				if(args[0]=="i"&&(args[1]=="crazy"||args[1]=="crazy?")){
					msg.channel.send(`No, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}. You're not crazy at all. Sometimes we can feel like we are, but really, you're just going through a very complex time right now.\nRemember to take breaks, they can help.\nAlso remember that we love you! :purple_heart:`)
				}
				break;
				case "i":
				if(args[0]=="love"&&args[1]=="you"){
					msg.channel.send(`I love you, too, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}!`)
				} else {
					msg.channel.send("Sorry, I didn't quite catch that.");
				}
				if(args[0]=="am"){
					if(args[1]=="gay"){
						if(args[0]=="gay"){
							msg.channel.send("I am, too!\n:gay_pride_flag::regional_indicator_g: :a: :regional_indicator_y: :regional_indicator_p: :regional_indicator_r: :regional_indicator_i: :regional_indicator_d: :regional_indicator_e::gay_pride_flag:")
						}
					}
				}
				break;
				case "im":
					if(args[0]=="gay"){
						let gresp=randomText(Texts.imgay)
						if(gresp==":gay:"){
							msg.channel.send(`${gaye}`)
						} else {
							msg.channel.send(gresp)
						}

					}
					if(args[0]=="lesbian"){
						let lresp=randomText(Texts.imlesbian)
						if(lresp==":valid:"){
							msg.channel.send(`${validemo}`)
						} else {
							msg.channel.send(lresp)
						}
					}
					if(args[0]=="ace"){
						let aresp=randomText(Texts.imace)
						if(aresp==":valid:"){
							msg.channel.send(`${validemo}`)
						} else {
							msg.channel.send(aresp)
						}
					}
				break;
				case "i'm":
					if(args[0]=="gay"){
						let gresp=randomText(Texts.imgay)
						if(gresp==":gay:"){
							msg.channel.send(`${gaye}`)
						} else {
							msg.channel.send(gresp)
						}
					}
					if(args[0]=="lesbian"){
						let lresp=randomText(Texts.imlesbian)
						if(lresp==":valid:"){
							msg.channel.send(`${validemo}`)
						} else {
							msg.channel.send(lresp)
						}
					}
					if(args[0]=="ace"){
						let aresp=randomText(Texts.imace)
						if(aresp==":valid:"){
							msg.channel.send(`${validemo}`)
						} else {
							msg.channel.send(aresp)
						}
					}
				break;
				default:
				return m.author.send("Sorry, I didn't quite catch that.");
				console.log(toString(args));
				break;

			}
		}
	};



	if(msg.guild!=(undefined||null)) {

		confs[msg.guild.id]={};
		confs[msg.guild.id].mod_e=false;
		confs[msg.guild.id].welc_e=false;
		confs[msg.guild.id].welc_msg="";
		confs[msg.guild.id].welc_chan="";
		confs[msg.guild.id].ban_e=false;
		confs[msg.guild.id].ban_msg="";
		confs[msg.guild.id].welc_re=false;
		confs[msg.guild.id].welc_rs=[];
		confs[msg.guild.id].welc_rc="";
		confs[msg.guild.id].disabled=["none"]
		use[msg.author.id]={};
		use[msg.author.id].admin=false;
		use[msg.author.id].silenced=false;

		function toLit(string,toberep,repstr){
			var repld=string.replace(toberep,repstr)
			return eval("`"+repld+"`");
		}

		function setupConfigs(server_name){

			client.query(`SELECT * FROM configs WHERE servname='${server_name}'`).then(serv=>{
				serv=serv.rows[0];
				var banvals=serv.ban_msg.split("---");
				var welcs=serv.welcome_roles.split("---");
				var wmsg=serv.welcome_msg.split("---");
				var dis;

				if(serv.moderation=="1"){
					confs[server_name].mod_e=true;
				} else {
					confs[server_name].mod_e=false;
				}

				if(banvals[0]=="1"){
					confs[server_name].ban_e=true;
					confs[server_name].ban_msg=banvals[1];
				} else {
					confs[server_name].ban_e=false;
				}

				if(welcs[0]=="1"){
					confs[server_name].welc_re=true;
					confs[server_name].welc_rs=welcs[1].split(",");
					confs[server_name].welc_rc=welcs[2];
				} else {
					confs[server_name].welc_re=false;
				}

				if(wmsg[0]=="1"){
					confs[server_name].welc_e=true;
					confs[server_name].welc_msg=wmsg[1];
					confs[server_name].welc_chan=wmsg[2];
				}else{
					confs[server_name].welc_e=false;
				}

				if(serv.disabled!=""){
					confs[server_name].disabled=serv.disabled.split(",");
				} else {
					confs[server_name].disabled=["none"];
				}
			//msg.channel.send("Setup Config done")
		}).catch(()=>{
			client.query(`CREATE TABLE IF NOT EXISTS configs (servname TEXT,moderation TEXT,welcome_msg TEXT,ban_msg TEXT,welcome_roles TEXT,disabled TEXT,autoroles TEXT)`).then(()=> {
				client.query(`SELECT * FROM configs WHERE servname='${msg.guild.id}'`).then(table=>{
					table=table.rows[0];
					if(table){
						return
					} else {
						client.query(`INSERT INTO configs (servname,moderation,welcome_msg,ban_msg,welcome_roles,disabled,autoroles) VALUES ($1,$2,$3,$4,$5,$6,$7)`,[msg.guild.id,"1","0---unset---general","0---unset","0---unset---unset","",""]);
					}
				})
			});
			//msg.channel.send("Setup Config done")
		});


	};

	function setupUser(server,usr){

		client.query(`SELECT * FROM "${server}_users" WHERE user_id='${usr}'`).then(retus=>{
			retus=retus.rows[0];
			if(retus.is_admin=="1"){
				use[usr].admin=true;
			} else {
				use[usr].admin=false;
			}

			if(retus.is_silenced=="1"){
				use[usr].silenced=true;
			} else {
				use[usr].silenced=false;
			}
			//msg.channel.send("Setup User done")
		}).catch(()=>{
			client.query(`CREATE TABLE IF NOT EXISTS "${msg.guild.id}_users" (user_name TEXT,user_id TEXT,lp_time TEXT,is_silenced TEXT,is_admin TEXT,timeout_count INTEGER)`).then(()=> {
				client.query(`SELECT * FROM "${msg.guild.id}_users" WHERE user_id='${msg.author.id}'`).then(table2=>{
					table2=table2.rows[0];
					if(table2){
						return
					} else {
						client.query(`INSERT INTO "${msg.guild.id}_users" (user_name,user_id,lp_time,is_silenced,is_admin,timeout_count) VALUES ($1,$2,$3,$4,$5,$6)`,[msg.author.username,msg.author.id,msg.createdAt,"0","0",0]);
					}

				})

			});
			//msg.channel.send("Setup User done")
		});


	};



	function setupTriggers(){
		client.query(`CREATE TABLE IF NOT EXISTS triggers (user_id TEXT, code TEXT, bad TEXT, okay TEXT, warn TEXT, name TEXT)`);
	};

	function setupRoles(){
		client.query(`CREATE TABLE IF NOT EXISTS "${msg.guild.id}_roles" (role_name TEXT,role_id TEXT,is_selfrole TEXT)`).then(()=>{
			//msg.channel.send("Setup Roles done")
				client.query(`SELECT * FROM "${msg.guild.id}_roles" WHERE is_selfrole='1'`, (err,res)=>{
					res.rows.forEach(function(row){
						if(err){
						console.log(err);
						}
						rnames.push(row.role_name);
						rnvals[row.role_name]=true;
						//console.log(row.role_name);
					})

		});

		client.query(`SELECT * FROM bundles WHERE server_id='${msg.guild.id}' AND is_selfrole='1'`,(err,res)=>{
			res.rows.forEach(function(row){
				if(err){
					console.log(err);
				}
				bnames.push(row.name);
				bnvals[row.name]=true;
			})
		})

	})
	}

		function postThings(m){
			client.query(`SELECT * FROM profiles WHERE user_id='${msg.author.id}'`, function(err,res){
				if(err){
					console.log("error selecting from profiles:\n"+err);
				} else {
					if(!res.rows[0]){
					return console.log(res.rows)
				}
				res=res.rows[0];

				client.query(`UPDATE profiles SET money=${parseInt(res.money)+5} WHERE user_id='${m.author.id}'`).catch(e=>{
					console.log("Error setting money:\nMoney type: "+typeof parseInt(res.money)+"\n"+e)
				});
				var exp=res.exp+"";
				if(exp.indexOf(";;")>-1){
					exp=res.exp.split(";;");
					exp=eval(exp[1]);
				} else {
					var exp=res.exp;
				}
				var lve=res.level;
				if(exp+5>=(Math.pow(lve,2)+100)){
					lve=lve+1;
					if(exp-(Math.pow(lve,2)+100)>=0){
						exp=exp-(Math.pow(lve,2)+100);
					} else {
						exp=0;
					}

					msg.channel.send(`Congratulations, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}! You are now level ${lve}!`)
				} else {
					exp=exp+5;
				}
				client.query(`UPDATE profiles SET exp=${exp}, level=${lve} WHERE user_id='${m.author.id}'`).catch(e=>{
					console.log("Error setting exp/level:\n"+e)
				});
				}
			})
		}

	function setupCommands(){
		if(msg.content.toLowerCase().startsWith(config.prefix)){
			cont=msg.content.split(" ");
			if(cont[1]!=undefined){
				command=cont[1].toLowerCase();
				args=msg.content.toLowerCase().split(" ").slice(2);
				args2=msg.content.split(" ").slice(2);
				console.log(msg.content)
			} else {
				msg.channel.send("That's me!")
				return;
			}
		}
		//msg.channel.send("Setup Commands done")
	}

	function adminCommands(comm){
		if((confs[msg.guild.id].mod_e&&use[msg.author.id].admin)||msg.author.id=="248290631640678400"){
			switch(comm){
				case "help":
					msg.channel.send({embed:adHelpEmbed})
					break;
				case "testimg":
					let ol=args[1];
					let toff=eval(args[2]);
					let loff=eval(args[3]);
					//-->bookmark
					sharp("./img/base.png")
						.overlayWith(`./img/${ol}.png`,{top:toff,left:loff})
						.toFile(`${msg.author.id}.png`)
						.then(()=>{
							msg.channel.send("New image:",{files:[`${msg.author.id}.png`]})
							setTimeout(function(){fs.unlink(`${msg.author.id}.png`)},500)
						})
						.catch(err => console.log(err));
					break;
				case "textimg":
					const svgtext= new Buffer.from(`<svg height="256" width="256"><text x="${eval(args[2])}" y="${eval(args[3])}" font-size="20" fill="${args[1]}">${msg.content.split(" ").slice(6).join(" ")}</text></svg>`);
					console.log(svgtext)
					sharp(svgtext).toFile(`${msg.author.id}_buffer.png`).then(()=>{
						setTimeout(function(){
							sharp("./img/base2.png")
							.overlayWith(`${msg.author.id}_buffer.png`)
							.toFile(`${msg.author.id}.png`)
							.then(()=>{
								msg.channel.send("New image:",{files:[`${msg.author.id}.png`]})
								msg.channel.send("buffer:",{files:[`${msg.author.id}_buffer.png`]})
								setTimeout(function(){fs.unlink(`${msg.author.id}.png`)},500)
								setTimeout(function(){fs.unlink(`${msg.author.id}_buffer.png`)},500)
							})
							.catch(err => console.log(err));
							},500)
						})

					break;
				case "refeed":
					client.query(`DROP TABLE feedback`)
					client.query(`CREATE TABLE IF NOT EXISTS feedback (user_id TEXT, ticket TEXT, channel_id TEXT, msg TEXT)`)
					msg.channel.send(`All feedback in table is now deleted.`)
					break;
				case "cfeed":
					client.query(`SELECT FROM feedback`,(err,res)=>{
						msg.channel.send(`Currently there ${res.rows.length==1 ? "is" : "are"} ${res.rows.length} ${res.rows.length==1 ? "row" : "rows" } in feedback.`)
					})
					break;
				case "strikes":
					if(msg.mentions.users.size>0){
						var ts=msg.mentions.users.first();
						if(ts.id==msg.member.id){
							msg.channel.send("You cannot change the strike amount of your own account.");
							return;
						}
						switch(args[1]){
							case "add":
							var snum=1
							if(!isNaN(args[2])){
								snum=args[2];
							}
							client.query(`SELECT * FROM "${msg.guild.id}_users" WHERE user_id='${ts.id}'`).then(memb=>{
								memb=memb.rows[0];
								if(memb){
									var newcount=eval(memb.timeout_count)+eval(snum);
									client.query(`UPDATE "${msg.guild.id}_users" SET timeout_count=${newcount} WHERE user_id='${ts.id}'`).then(()=>{
										msg.channel.send(`New count on user: ${newcount}`)
									})
								} else {
									client.query(`INSERT INTO "${msg.guild.id}_users" (user_name,user_id,lp_time,is_silenced,is_admin,timeout_count) VALUES ($1,$2,$3,$4,$5,$6)`,[msg.author.username,msg.author.id,msg.createdAt,"0","0",snum]);
									msg.channel.send(`New count on user: ${snum}`)
								}
							})
							break;
							case "set":
							var snum;
							if(!isNaN(args[2])){
								snum=args[2];
							} else if (!isNaN(args[3])){
								snum=args[3];
							} else {
								msg.channel.send("Please give a value to set.");
								return
							}
							client.query(`SELECT * FROM "${msg.guild.id}_users" WHERE user_id='${ts.id}'`).then(memb=>{
								memb=memb.rows[0];
								if(memb){
									client.query(`UPDATE "${msg.guild.id}_users" SET timeout_count=${snum} WHERE user_id='${ts.id}'`).then(()=>{
										msg.channel.send(`New count on user: ${snum}`)
									})
								} else {
									client.query(`INSERT INTO "${msg.guild.id}_users" (user_name,user_id,lp_time,is_silenced,is_admin,timeout_count) VALUES ($1,$2,$3,$4,$5,$6)`,[msg.author.username,msg.author.id,msg.createdAt,"0","0",snum]);
									msg.channel.send(`New count on user: ${snum}`)
								}
							})
							break;
							case "remove":
							var snum=1
							if(!isNaN(args[2])){
								snum=args[2];
							}
							client.query(`SELECT * FROM "${msg.guild.id}_users" WHERE user_id='${ts.id}'`).then(memb=>{
								memb=memb.rows[0];
								if(memb){
									var newcount;
									if(eval(memb.timeout_count)-eval(snum)>0){
										newcount=eval(memb.timeout_count)-eval(snum);
									} else {
										newcount=0
									}

									client.query(`UPDATE "${msg.guild.id}_users" SET timeout_count=${newcount} WHERE user_id='${ts.id}'`).then(()=>{
										msg.channel.send(`New count on user: ${newcount}`)
									})
								} else {
									client.query(`INSERT INTO "${msg.guild.id}_users" (user_name,user_id,lp_time,is_silenced,is_admin,timeout_count) VALUES ($1,$2,$3,$4,$5,$6)`,[msg.author.username,msg.author.id,msg.createdAt,"0","0",0]);
									msg.channel.send(`User already has no strikes.`)
								}
							})
							break;
							default:
							msg.channel.send(Texts.strikeshelp)
							break;
						}
					} else {
						msg.channel.send(Texts.strikeshelp)
					}
					break;
				case "exp":
					switch(args[1]){
						case "add":
							if(msg.mentions.users.size>0){
								client.query(`SELECT * FROM profiles WHERE user_id=${msg.mentions.users.first().id}`).then(taexp=>{
									taexp=taexp.rows[0];
									if(taexp){
										if(args[2]==undefined){return msg.channel.send("Please specify amount of EXP to add!")}
										var cexp=taexp.exp;
										var clvl=taexp.level;
										if(cexp+eval(args[2])>=(Math.pow(clvl,2)+100)){
											msg.channel.send(`User ${msg.mentions.users.first().username} is now level ${clvl+1}!`)
											clvl=clvl+1;
											cexp=0;
										} else {
											msg.channel.send(`User ${msg.mentions.users.first().username} now has ${cexp+eval(args[2])} exp!`)
											cexp=cexp+eval(args[2]);
										}
										client.query(`UPDATE profiles SET level=${clvl},exp=${cexp} WHERE user_id=${msg.mentions.users.first().id}`)
									} else {
										msg.channel.send("That user wasn't found.")
									}
								})
							} else {
								msg.channel.send("Please specify a user!")
							}
							break;
					}
					break;
				case "bundles":
					switch(args[1]){
						case "new":
						if(args[4]!=undefined){
							if(args[4]=="1" || args[4]=="0" ){
								var bn=args2[2];
								var rsta=args2[3].split(",");
								var isr=args[4];
								var rids=[];
								for(var x=0;x<rsta.length;x++){
									var nr=rsta[x].split("|");
									var r=msg.guild.roles.find(r => r.name == nr.join(" "));
									console.log(`role name = '${nr.join(" ")}'`);
									rids.push(r.id)
								}
								setTimeout(function(){
									client.query(`INSERT INTO bundles (server_id,name,role_ids,is_selfrole) VALUES ($1,$2,$3,$4)`,[msg.guild.id,bn,rids.join(","),isr])
									msg.channel.send("Bundle made!")
								},500)
							} else {
								msg.channel.send(Texts.bunh)
							}
						} else {
							msg.channel.send(Texts.bunh)
						}
						break;
						case "delete":
						client.query(`SELECT * FROM bundles WHERE server_id='${msg.guild.id}' AND name='${args[2]}'`).then(gottenb=>{
							gottenb=gottenb.rows[0];
							if(gottenb){
								client.query(`DELETE FROM bundles WHERE server_id='${msg.guild.id}' AND name='${args[2]}'`);
								msg.channel.send("Deleted.")
							} else {
								msg.channel.send("Bundle not found.")
							}
						})
						break;
						case "add":
						if(msg.mentions.users.size<1){
							return msg.channel.send(Texts.buah);
						}
						client.query(`SELECT * FROM bundles WHERE server_id='${msg.guild.id}' AND name='${args[2]}'`).then(bundle=>{
							bundle=bundle.rows[0];
							var rtaids=bundle.role_ids.split(",");
							var alreadyhad=[];
							for(var ex=0;ex<rtaids.length;ex++){
								if(!msg.guild.member(msg.mentions.users.first()).roles.has(rtaids[ex])) {
									msg.guild.member(msg.mentions.users.first()).addRole(rtaids[ex]);
								} else {
									var darn=msg.guild.roles.find(r => r.id == rtaids[ex]);
									alreadyhad.push(darn.name);
								}
							}
							if(alreadyhad.length>0){
								msg.channel.send("User already had "+alreadyhad.join(", "))
							}
							msg.channel.send("Done~")
						});
						break;
						case "remove":
						if(msg.mentions.users.size<1){
							return msg.channel.send(Texts.buah);
						}
						client.query(`SELECT * FROM bundles WHERE server_id='${msg.guild.id}' AND name='${args[2]}'`).then(bundle=>{
							bundle=bundle.rows[0];
							var rtaids=bundle.role_ids.split(",");
							for(var ex=0;ex<rtaids.length;ex++){
								if(msg.guild.member(msg.mentions.users.first()).roles.has(rtaids[ex])) {
									msg.guild.member(msg.mentions.users.first()).removeRole(rtaids[ex]);
								} else {
									var darn=msg.guild.roles.find(r => r.id == rtaids[ex]);
									msg.channel.send(`User ${msg.mentions.users.first().username} already doesn't have role ${darn.name}.`)
								}
							}
							msg.channel.send("Done~")
						});
						break;
						default:
						msg.channel.send(Texts.bunh)
						break;
					}
					break;
				case "welcome":
					if(confs[msg.guild.id].welc_re){
						if(msg.mentions.users.size<0){
							return msg.channel.send("Please mention a user.");
						}
						for(var tr=0;tr<confs[msg.guild.id].welc_rs.length;tr++){
							msg.guild.member(msg.mentions.users.first()).addRole(confs[msg.guild.id].welc_rs[tr]);
						}
						if(confs[msg.guild.id].welc_rc!==""||confs[msg.guild.id].welc_rc!==undefined){
							msg.guild.channels.find(c => c.name == confs[msg.guild.id].welc_rc).send(`Congrats! You've officially been welcomed, ${msg.mentions.users.first().username}!`);
						} else {
							msg.channel.send(`Congrats! You've officially been welcomed, ${msg.mentions.users.first().username}!`)
						}

					} else {
						msg.channel.send("Welcome roles not enabled on this server.")
					}
					break;
				case "edit":
					if(args[1]=="mod"){
						var ed=args[2];
						client.query(`SELECT * FROM configs WHERE servname='${msg.guild.id}'`).then(servergot=>{
							servergot=servergot.rows[0];
							switch(ed){
								case "1":
								if(servergot.moderation=="1"){
									msg.channel.send("Mod already enabled.")
								} else {
									client.query(`UPDATE configs SET moderation='1' WHERE servname='${msg.guild.id}'`)
									msg.channel.send("Mod enabled.")
								}
								break;
								case "0":
								if(servergot.moderation=="0"){
									msg.channel.send("Mod already disabled.")
								} else {
									client.query(`UPDATE configs SET moderation='0' WHERE servname='${msg.guild.id}'`)
									msg.channel.send("Mod disabled.")
								}
								break;
								default:
								msg.channel.send("Please provide a 1 or 0.")
								break;
							}
						})

					}
					if(args[1]=="welcome"){
					// 	const collector=new Discord.MesageCollector(msg.channel,m => m.author.id==msg.author.id,{time: 100000})
					// 	var wvals=[];
					// 	var wopts=[1,1];
					// 	client.query(`SELECT * FROM configs WHERE servname='msg.guild.id'`,(err,w)=>{
					// 		w=w.rows[0];

					// 	})
					// }
						//msg.channel.send("```\nChoose a number:\n[1] Enable/disable [2] \n```")
						var ed=args[2];
						client.query(`SELECT * FROM configs WHERE servname='${msg.guild.id}'`).then(servergot=>{
							servergot=servergot.rows[0];
							var welcvals=servergot.welcome_msg.split("---");
							switch(ed){
								case "1":
								if(welcvals[0]=="1"){
									msg.channel.send("Welcome already enabled.")
								} else {
									client.query(`UPDATE configs SET welcome_msg='1---${welcvals[1]}---${welcvals[2]}' WHERE servname='${msg.guild.id}'`)
									msg.channel.send("Welcome enabled.")
								}
								break;
								case "0":
								if(welcvals[0]=="0"){
									msg.channel.send("Welcome already disabled.")
								} else {
									client.query(`UPDATE configs SET welcome_msg='0---${welcvals[1]}---${welcvals[2]}' WHERE servname='${msg.guild.id}'`)
									msg.channel.send("Welcome disabled.")
								}
								break;
								case "message":
								var newmes=msg.content.split(" ").slice(5).join(" ");
								client.query(`UPDATE configs SET welcome_msg='${welcvals[0]}---${newmes}---${welcvals[2]}' WHERE servname='${msg.guild.id}'`)
								msg.channel.send("Updated welcome message!")
								break;
								case "channel":
								var chan=args[3];

								if(msg.guild.channels.find(c => c.name == chan)){
									client.query(`UPDATE configs SET welcome_msg='${welcvals[0]}---${welcvals[1]}---${chan}' WHERE servname='${msg.guild.id}'`);
									msg.channel.send("Channel updated.")
								} else {
									msg.channel.send("Please provide a valid channel.")
								}
								break;
								case "roles":
								if(args[3]=="1" || args[3]=="0"){
									client.query(`SELECT * FROM configs WHERE servname='${msg.guild.id}'`).then(ser=>{
										ser=ser.rows[0];
										var rvals=ser.welcome_roles.split("---");
										if(rvals[0]==args[3]){
											return msg.channel.send("Roles are already "+(rvals[0]=="1" ? "enabled" : "disabled"));
										}
										client.query(`UPDATE configs SET welcome_roles='${args[3]}---${rvals[1]}---${rvals[2]}' WHERE servname='${msg.guild.id}'`);
										msg.channel.send("Updated.")
									})
								} else if(args[3]==undefined) {
									msg.channel.send("Please type a 1 or 0.")
								} else if(args[3]=="reset"){
									client.query(`UPDATE configs SET welcome_roles='0---unset---unset' WHERE servname='${msg.guild.id}'`)
									msg.channel.send("Roles reset.")
								} else if(args[3]=="channel"){
									client.query(`SELECT * FROM configs WHERE servname='${msg.guild.id}'`).then(ser=>{
										ser=ser.rows[0];
										var rvals=ser.welcome_roles.split("---");
										client.query(`UPDATE configs SET welcome_roles='${rvals[0]}---${rvals[1]}---${args[4]}' WHERE servname='${msg.guild.id}'`);
										msg.channel.send("Channel updated.")
								})
								} else {
									client.query(`SELECT * FROM configs WHERE servname='${msg.guild.id}'`).then(ser=>{
										ser=ser.rows[0];
										var rvals=ser.welcome_roles.split("---");
										var rvids=args2[3].split(",");
										var nrids=[];
										for(var v=0;v<rvids.length;v++){

											nrids.push(msg.guild.roles.find(r => r.name ==rvids[v].split("|").join(" ")).id);
										}
										client.query(`UPDATE configs SET welcome_roles='${rvals[0]}---${nrids.join(",")}---${rvals[2]}' WHERE servname='${msg.guild.id}'`);
										msg.channel.send("Updated.")
									})
								}
								break;
								default:
								msg.channel.send("Please provide a 1 or 0.")
								break;
							}
						})
					}
					break;
				case "enable":
					if(args[1]!=undefined){
					client.query(`SELECT * FROM configs WHERE servname='${msg.guild.id}'`).then(gse=>{
						gse=gse.rows[0];
						var ds=(gse.disabled!="" ? gse.disabled.split(",") : "none");
						setTimeout(function(){
							if(ds!="none"){
								if(ds.includes(args[1])){
									ds.splice(ds.indexOf(args[1]),1);

									client.query(`UPDATE configs SET disabled='${ds.join(",")}' WHERE servname='${msg.guild.id}'`).then(()=>{
										msg.channel.send(`Enabled ${args[1]}`);
									})
								} else if(Texts.avail[args[1]]) {
									msg.channel.send(`${args[1]} is already enabled.`)
								} else {
									msg.channel.send("Command "+args[1]+" does not exist. Existing commands:\n"+Object.keys(Texts.avail).join("\n"))
								}
							} else {
								if(Texts.avail[args[1]]) {
									msg.channel.send(`${args[1]} is already enabled.`)
								} else {
									msg.channel.send("Command "+args[1]+" does not exist. Existing commands:\n"+Object.keys(Texts.avail).join("\n"));
								}
							}
						},500)
						})
					} else {
						return msg.channel.send("Existing commands:\n"+Object.keys(Texts.avail).join("\n"));
					}
					break;
				case "disable":
					if(args[1]!=undefined){
					client.query(`SELECT * FROM configs WHERE servname='${msg.guild.id}'`).then(gse=>{
						gse=gse.rows[0];
						var ds=(gse.disabled!="" ? gse.disabled.split(",") : "none");
						setTimeout(function(){
							if(ds!="none"){
								if(ds.includes(args[1])){
									msg.channel.send("Already disabled.")
								} else if(Texts.avail[args[1]]) {
									client.query(`UPDATE configs SET disabled='${ds.join(",")+","+args[1]}' WHERE servname='${msg.guild.id}'`)
									msg.channel.send(`Disabled ${args[1]}`)
								} else {
									msg.channel.send("Command "+args[1]+" does not exist. Existing commands:\n"+Object.keys(Texts.avail).join("\n"))
								}
							} else {
								if(Texts.avail[args[1]]) {
									client.query(`UPDATE configs SET disabled='${args[1]}' WHERE servname='${msg.guild.id}'`)
									msg.channel.send(`Disabled ${args[1]}`)
								} else {
									msg.channel.send("Command "+args[1]+" does not exist. Existing commands:\n"+Object.keys(Texts.avail).join("\n"))
								}
							}
						},500)
						})
					}else {
						return msg.channel.send("Existing commands:\n"+Object.keys(Texts.avail).join("\n"));
					}
					break;
				case "members":
					if (config.accepted_ids.includes(msg.author.id)){
						switch(args[1]){
							case "find":
								msg.channel.send("Searching...")
								var fmbr;
								for(var xf=0; xf<bot.guilds.array().length; xf++){
									msg.channel.send(`Checking ${bot.guilds.array()[xf]}...`)
									fmbr=bot.guilds.array()[xf].members.find(m => m.id == args[2])
									if(fmbr){
										break;
									}
								}
								setTimeout(function(){
									if(fmbr){
										msg.channel.send("Found: "+fmbr)
									} else {
										msg.channel.send("Didn't find that member.")
									}
								},2000)
								break;
							case "info":
								msg.channel.send("Collecting info...")
								var fmbr2;
								var fmbg=[];
								for(var xf2=0; xf2<bot.guilds.array().length; xf2++){
									msg.channel.send(`Checking ${bot.guilds.array()[xf2]}...`)
									fmbr2=bot.guilds.array()[xf2].members.find(m => m.id == args[2])
									if(fmbr2){
										fmbg.push(bot.guilds.array()[xf2])
									}
								}
								setTimeout(function(){
									if(fmbr2){
										msg.channel.send(`**Found:** ${fmbr2}\n**Shared guilds:**\n`+"```"+`\n${fmbg.join("\n")}\n`+"```")
									} else {
										msg.channel.send("Didn't find that member.")
									}
								},2000)
								break;
							default:
								msg.channel.send("Available commads: find, info")
								break;
						}
					}
					break;
				case "guilds":
				if (config.accepted_ids.includes(msg.author.id)){
					switch(args[1]){
						case "owner":
							var fgld=bot.guilds.find(g => g.name == msg.content.split(" ").splice(4).join(" "));
							if(fgld){
								msg.channel.send(fgld.owner.user.username)
							} else {
								msg.channel.send("Couldn't find that guild :(")
							}
							break;
						case "members":
							var fgld2=bot.guilds.find(g => g.name == msg.content.split(" ").splice(4).join(" "));
							if(fgld2){
								msg.channel.send(fgld2.members.array().join("\n"))
							} else {
								msg.channel.send("Couldn't find that guild :(")
							}
							break;
						case "list":
							msg.channel.send(bot.guilds.array().join("\n"))
							break;
						default:
							msg.channel.send("Available commands: owner, members, list")
							break;
					}
				} else {
					msg.channel.send("Only the bot owner can use this command.")
				}
					break;
				case "leave":
				if (config.accepted_ids.includes(msg.author.id)){
					if(args2[1]!=undefined){
							var a=args2[1].split("|").join(" ");
							var gl=bot.guilds.find(g => g.name == a);
							gl.leave();
					} else {
						msg.guild.leave();
					}
				} else {
					msg.channel.send("Only the bot owner can use this command.")
				}
					break;
				case "init":
					if(args[1]!=undefined){
						var rt=args2[1].split("|");
						if(args2.length>1){
							rt=rt.join(" ");
						}
						if(msg.guild.roles.find(r => r.name == rt)){
							var r=msg.guild.roles.find(r => r.name == rt);
							if(args2[2]=="1"||args2[2]=="0"){
								client.query(`SELECT * FROM "${msg.guild.id}_roles" WHERE role_id='${r.id}'`).then((initrl)=>{
									initrl=initrl.rows[0];
									if(initrl){
										client.query(`UPDATE "${msg.guild.id}_roles" SET is_selfrole=${args2[2]} WHERE role_id='${r.id}'`).then(()=>{
											msg.channel.send(`Role ${args2[1].split("|").join(" ")} was found and has been updated.`)
										});
									} else {
										client.query(`INSERT INTO "${msg.guild.id}_roles" VALUES ($1,$2,$3)`,[r.name.toLowerCase(),r.id,args2[2]]).then(()=>{
											msg.channel.send(`Role ${args2[1].split("|").join(" ")} was not found and has been added.`)
										});
									}

								}).catch(()=>{
									client.query(`INSERT INTO "${msg.guild.id}_roles" VALUES ($1,$2,$3)`,[r.name.toLowerCase(),r.id,args2[2]]).then(()=>{
										msg.channel.send(`Role ${arg2s[1]} was not found and has been added.\n(Error caught and ammended)`)
									});
								});
							} else {
								msg.channel.send("Please type a 1 or 0 for self-rolablility.")
							}
						} else {
							msg.channel.send("That is not a valid role.")
							return;
						}
					} else {
						msg.channel.send("Init useage:\nheysteve init [role name] [number for selfrole]")
					};
					break;
				case "updatebanker":
					var d=new Date();
					client.query(`UPDATE configs SET moderation='${d.getMonth()}/${d.getDate()}' WHERE servname='bank_master'`).then(()=>{
						msg.channel.send("Banker info updated.")
					})
					break;
					case "testbank":
					client.query(`SELECT * FROM configs WHERE servname="bank_master"`).then((ba)=>{
						ba=ba.rows[0];
						var d=new Date();
						msg.channel.send("Mod val= "+ba.moderation)
						msg.channel.send("Day val="+d.getMonth()+"/"+d.getDate())
						msg.channel.send((d.getMonth()+"/"+d.getDate())==ba.moderation);
					})
					break;
				case "reset":
					client.query(`UPDATE bank SET daily='0'`).then(()=>{
						msg.channel.send("Dailies have been reset.");
					});
					break;
				case "shutdown":
					process.exit();
					break;
				case "promote":
					if(msg.mentions.users.size===0){
						return msg.channel.send("Please mention a user.");
					}
					var mid=msg.mentions.users.first().id;
					client.query(`UPDATE "${msg.guild.id}_users" SET is_admin=1 WHERE user_id='${mid}'`).then(()=>{
						msg.channel.send(`User <@${mid}> has been promoted. Welcome to Admin rank!`);
					});
					break;
				case "demote":
					if(msg.mentions.users.size===0){
						return msg.channel.send("Please mention a user.");
					}
					var mid=msg.mentions.users.first().id;
					client.query(`UPDATE "${msg.guild.id}_users" SET is_admin=0 WHERE user_id='${mid}'`).then(()=>{
						msg.channel.send(`User <@${mid}> has been demoted. Better luck next time?`);
					});
					break;
				case "role":
					if((args[1]=="add"||args[1]=="remove")&&args[2]!=undefined&&msg.mentions.users.size>0){
						var rolear=args[2].split(",");
						var ar2=rolear.join(", ");
						var na=[];
						var nr=[];
						var ad=[];
						var rm=[];
						for(var x=0;x<rolear.length;x++){
							var rt=rolear[x].split("|");
							if(rt.length>1){
								rt=rt.join(" ");
							}
							var torl=msg.guild.member(msg.mentions.members.first());
							client.query(`SELECT * FROM "${msg.guild.id}_roles" WHERE role_name='${rt}'`).then((rta)=>{
								rta=rta.rows[0];
								if(rta){
									if(args[1]=="add"){
										if(torl.roles.has(rta.role_id)){
											na.push(rta.role_name)
										} else {
											torl.addRole(rta.role_id);
											ad.push(rta.role_name)
										}
									} else if(args[1]=="remove"){
										if(torl.roles.has(rta.role_id)){
											torl.removeRole(rta.role_id);
											rm.push(rta.role_name)
										} else {
											nr.push(rta.role_name)
										}
									} else {
										msg.channel.send("Please type add or remove.")
									}
								} else {
									msg.channel.send("That role was not found.")
								}
							});
						}
						setTimeout(function(){
							if(args[1]=="add"){
								if(ad[0]!=undefined||ad[0]!=null){
									msg.channel.send(`Added ${ad.join(", ")} to ${torl.user.username}`)
									if(na[0]!=undefined||na[0]!=null){
										msg.channel.send(`Did not add ${na.join(", ")} to ${torl.user.username}`)
									}
								}else {
									if(na[0]!=undefined||na[0]!=null){
										msg.channel.send(`Did not add ${na.join(", ")} to ${torl.user.username}`)
									} else {
										msg.channel.send("Did nothing.")
									}
								}
							} else if(args[1]=="remove") {
								if(rm[0]!=undefined||rm[0]!=null){
									msg.channel.send(`Removed ${rm.join(", ")} from ${torl.user.username}`)
									if(nr[0]!=undefined||nr[0]!=null){
										msg.channel.send(`Did not remove ${nr.join(", ")} from ${torl.user.username}`)
									}
								} else {
									if(nr[0]!=undefined||nr[0]!=null){
										msg.channel.send(`Did not remove ${nr.join(", ")} from ${torl.user.username}`)
									} else {
										msg.channel.send("Did nothing.")
									}
								}
							} else {
								return;
							}
						},1000)

					} else if(args[1]=="edit"&&args[4]!=undefined){
						if(msg.guild.roles.find(r => r.name == args[2].split("|").join(" "))){
							var rl=msg.guild.roles.find(r => r.name == args[2].split("|").join(" "));
							var attr=args[3];


							switch(attr){
								case "color":
								var vall=args[4];
								rl.setColor(parseInt(vall, 16))
								.then(() =>{
								msg.channel.send(`Changed role ${args[2].split("|").join(" ")}'s color to ${parseInt(vall, 16)}.`)
								});
								break;
								case "name":
								var vall=args[4].split("|").join(" ");
								rl.edit({"name":vall}).catch(console.error)
								.then(()=>{
									client.query(`SELECT * FROM "${msg.guild.id}_roles" WHERE role_name='${args[2].split("|").join(" ")}'`).then(gtr=>{
										gtr=gtr.rows[0];
										if(gtr){
											client.query(`UPDATE "${msg.guild.id}_roles" SET role_name='${vall}' WHERE role_name='${args[2].split("|").join(" ")}'`)
										} else {
											return
										}
									})
								msg.channel.send(`Changed role ${args[2].split("|").join(" ")}\'s name to ${vall}.`)
								});
								break;
								default:
								msg.channel.send("Available attributes: color, name")
								break;
							}
						} else {
							return msg.channel.send("Please enter a valid role name.")
						}
					} else if(args[1]=="new"&&args2[2]!=undefined){
						msg.guild.createRole().then (aR => {
							aR.edit({name:args[2].split("|").join(" ")});
							msg.channel.send(`Role ${args2[2].split("|").join(" ")} made.`)
							}).catch(console.error);
					} else if(args[1]=="delete"&&args[2]!=undefined){
						if(msg.guild.roles.find(r => r.name == args2[2].split("|").join(" "))){
							var toDel=msg.guild.roles.find(r => r.name == args2[2].split("|").join(" "));
							toDel.delete().catch(console.error)
							.then(()=>{
								client.query(`SELECT * FROM "${msg.guild.id}_roles" WHERE role_name='${args2[2].split("|").join(" ")}'`).then(gtr=>{
									gtr=gtr.rows[0];
									if(gtr){
										client.query(`DELETE FROM "${msg.guild.id}_roles" WHERE role_name='${args2[2].split("|").join(" ")}'`)
									}
								})
								msg.channel.send(`Deleted role ${args2[2].split("|").join(" ")}.`)
								});
						} else {
							msg.channel.send("Please provide a valid role.")
						}
					} else {
						msg.channel.send("Role useage:\nheysteve * role [add/remove] [role|name] [user_mention]\nOR\nheysteve * role edit [role|name] [attribute] [value]")
					}
					break;
				case "emoji":
					switch(args[1]){
						case "add":
							if(args[2]!=undefined && args[3]!=undefined){
								msg.guild.createEmoji(args[3],args[2]).then(emote=>{
									msg.channel.send(`Emoji ${emote.name} created~`)
								}).catch(err=>{
										if(err){
											console.log(err);
											msg.channel.send("There was an error.");
										}
								})
							} else {
								msg.channel.send("**USAGE**:\nheysteve * emoji add [name] [url to image]")
							}
							break;
						case "delete":
							if(args[2]!=undefined){
								msg.guild.deleteEmoji(msg.guild.emojis.find(e => e.name == args[2]));
								msg.channel.send("Deleted "+args[2]);
							} else {
								msg.channel.send("**USAGE**:\nheysteve * emoji delete [emoji or emoji name]")
							}
							break;
						default:
							msg.channel.send("**USEAGE**:\nheysteve * emoji <add|delete> [name] [url if adding]")
							break;
					}
					break;
				case "menutest":
					var msgtoedit;
					msg.channel.send("```\nPlease choose 1, 2, or 3```").then(mesg=>{
						msgtoedit=mesg;
					});
					const collector=new Discord.MessageCollector(msg.channel,m => m.author.id === msg.author.id, {time: 10000});
					collector.on("collect", message=>{
						if (message.content=="1"){
							message.delete()
							msgtoedit.edit("You chose 1!").then(()=>{
								collector.stop();
							})
						}else if (message.content=="2"){
							message.delete()
							msgtoedit.edit("You chose 2!").then(()=>{
								collector.stop();
							})
						}else if (message.content=="3"){
							message.delete()
							msgtoedit.edit("You chose 3!").then(()=>{
								collector.stop();
							})
						} else {
							message.delete()
							msgtoedit.edit("That's not a 1, 2, or 3...").then(()=>{
								collector.stop();
							})
						}
					})
					break;
				default:
					msg.channel.send(Texts.invalcom)
				break;
			}

		} else if((!confs[msg.guild.id].mod_e&&use[msg.author.id].admin)){
			switch(comm){
				case "edit":
				if(args[1]=="mod"){
					var ed=args[2];
					client.query(`SELECT * FROM configs WHERE servname='${msg.guild.id}'`).then(servergot=>{
						servergot=servergot.rows[0];
						switch(ed){
							case "1":
							if(servergot.moderation=="1"){
								msg.channel.send("Mod already enabled.")
							} else {
								client.query(`UPDATE configs SET moderation='1' WHERE servname='${msg.guild.id}'`)
							}
							break;
							case "0":
							if(servergot.moderation=="0"){
								msg.channel.send("Mod already disabled.")
							} else {
								client.query(`UPDATE configs SET moderation='0' WHERE servname='${msg.guild.id}'`)
							}
							break;
							default:
							msg.channel.send("Please provide a 1 or 0.")
							break;
						}
					})

				}
				break;
				default:
				msg.channel.send("Mod commands not enabled on this server.")
				break;
			}
		} else {
			msg.channel.send(Texts.notaderror)
		}
	};

	function runCommand(command){
		switch(command) {

			/********************************************************************** PRACTICAL STUFF **********************************************************************
			********** So far includes:
			********** -Help
			********** -Feedback
			********** -Color
			********** -Resources
			********** -Profiles
			********** -Notes
			********** -Daily/Banking
			********** -Admin commands
			********** -Roles
			********** -Change
			********** -Triggers
			***********************************************************************************************************************************************************/
			case "help":
				msg.channel.send({embed: helpEmbed}).catch(error=>{
					if(error){
						console.log(error)
						msg.channel.send(Texts.help)
					}
				});
				break;
			case "feedback":
				let fmsg=msg.content.split(" ").slice(2).join(" ");
				let fcd=genCode(6)
				client.query(`INSERT INTO feedback (user_id,ticket,channel_id,msg) VALUES ($1,$2,$3,$4)`,[msg.author.id,fcd,msg.channel.id,fmsg])
				var embed=new Discord.RichEmbed();
				embed.setThumbnail(msg.author.avatarURL)
				embed.setAuthor(`${msg.author.tag}`)
				embed.addField("Message",fmsg)
				embed.setFooter(`Ticket code: ${fcd}`)
				bot.users.find(u => u.id == config.accepted_ids[0]).send("FEEDBACK",{embed}); //sends to owner- make sure main acc id is first in array
				msg.channel.send("Thanks for the feedback :purple_heart:")
				break;
			case "color":
				if(args[0]!=undefined){
					var h=hex2rgb(args[0]);
					var img=pimg.createImage(256,256);
					img.fillRect(0,0,256,256,{red:h.r,green:h.g,blue:h.b,alpha:255});
					img.writeImage(`${msg.author.id}.png`,function(err){
						if(err){
							console.log(err)
						}
						console.log("Wrote file")
					});

					setTimeout(function(){
						msg.channel.send("Color:",{files:[`${msg.author.id}.png`]}).then(()=>{
							fs.unlink(`${msg.author.id}.png`)
						});
					},500)

				}
				break;
			case "resources":
				msg.channel.send("```\nWhich would you like to do?\n\n[1]: Add\n[2]: List```")
				const collector=new Discord.MessageCollector(msg.channel, m => m.author.id===msg.author.id);
				let step=1;
				let choice=0;
				var renm;
				let t_out=setTimeout(function(){
					msg.channel.send("Response period ended: took too long to respond")
					collector.stop()
				},10000);
				collector.on("collect", rmsg=>{
					switch(step){
						case 1:
							switch(rmsg.content){
								case "1":
									rmsg.channel.send("What should the resource name be?")
									clearTimeout(t_out);
									t_out=setTimeout(function(){
										msg.channel.send("Response period ended: took too long to respond")
										collector.stop()
									},10000);
									step=2
									ch=1;
									break;
								case "2":
									var srcs=[];
									var embed=new Discord.RichEmbed();
									client.query(`SELECT * FROM resources WHERE server_id='${msg.guild.id}'`,(err,sc)=>{
										sc.rows.forEach(function(row){
											if(err){
											console.log(err);
										}
										srcs.push(row.name)
										})

									})
									setTimeout(function(){
											if(srcs.length<1){
												msg.channel.send("There are no resources registered to this server.")
												clearTimeout(t_out)
												collector.stop()
											} else {
												embed.addField(`Resources for ${rmsg.guild.name}`,srcs.join("\n"))
												rmsg.channel.send({embed})
												rmsg.channel.send("Choose a name to view a resource")
												clearTimeout(t_out);
												t_out=setTimeout(function(){
													msg.channel.send("Response period ended: took too long to respond")
													collector.stop()
												},10000);
												step=2;
												ch=2;
											}
										},500)
									break;
								}
								break;
						case 2:
							switch(ch){
								case 1:
								client.query(`SELECT * FROM resources WHERE server_id='${rmsg.guild.id}' AND name='${rmsg.content}'`).then(grsc=>{
									grsc=grsc.rows[0];
									if(grsc){
										msg.channel.send("Resource with that name already exists. Try again.")
										clearTimeout(t_out);
										t_out=setTimeout(function(){
											msg.channel.send("Response period ended: took too long to respond")
											collector.stop()
										},10000);
									} else {
										msg.channel.send("Give me a url")
										renm=rmsg.content;
										clearTimeout(t_out);
										t_out=setTimeout(function(){
											msg.channel.send("Response period ended: took too long to respond")
											collector.stop()
										},10000);
										step=3;
										ch=1;
									}
								})

									break;
								case 2:
										client.query(`SELECT * FROM resources WHERE server_id='${rmsg.guild.id}' AND name='${rmsg.content}'`).then(res=>{
											res=res.rows[0];
											if(res){
												msg.channel.send("```\n"+`NAME: ${res.name}\nURL: ${res.url}\nADDED: by ${res.adder} on ${res.time_added.replace(";;;"," at ")}\n\nOPTIONS:\n[1]: Remove\n[2]: Edit\n[3]: Cancel`+"\n```")
												renm=rmsg.content;
												clearTimeout(t_out);
												t_out=setTimeout(function(){
													msg.channel.send("Response period ended: took too long to respond")
													collector.stop()
												},10000);
												step=3;
												ch=2;
											} else {
												msg.channel.send(rmsg.content + " not found. Try again.")
												clearTimeout(t_out);
												t_out=setTimeout(function(){
													msg.channel.send("Response period ended: took too long to respond")
													collector.stop()
												},10000);
											}
										})
									break;
							}
							break;
						case 3:
							switch(ch){
								case 1:
									if(rmsg.content.match(/[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g)){
										var d=new Date();
										client.query(`SELECT * FROM resources WHERE server_id='${rmsg.guild.id}' AND url='${rmsg.content}'`).then(tarsc=>{
											tarsc=tarsc.rows[0];
											if(tarsc){
												msg.channel.send("Resource with that url already exists. Try again.")
												clearTimeout(t_out);
												t_out=setTimeout(function(){
													msg.channel.send("Response period ended: took too long to respond")
													collector.stop()
												},10000);
											} else {
												client.query(`INSERT INTO resources (server_id,name,url,adder,time_added) VALUES ($1,$2,$3,$4,$5)`,[rmsg.guild.id,renm,rmsg.content,rmsg.author.username,(d.getMonth()+1)+"/"+d.getDate()+"/"+d.getFullYear()+";;;"+d.getHours()+":"+d.getMinutes()])
												msg.channel.send("Resource added!")
												clearTimeout(t_out)
												collector.stop()
											}
										})
									} else {
										msg.channel.send("URL invalid! Try again")
										clearTimeout(t_out);
										t_out=setTimeout(function(){
											msg.channel.send("Response period ended: took too long to respond")
											collector.stop()
										},10000);
									}
									break;
								case 2:
									switch(rmsg.content){
										case "1":
										client.query(`DELETE FROM resources WHERE server_id='${rmsg.guild.id}' AND name='${renm}'`).then(()=>{
											rmsg.channel.send("Resource deleted.")
										})
										clearTimeout(t_out)
										collector.stop()
											break;
										case "2":
											msg.channel.send("```\nChoose what to edit.\n\n[1]: Name\n[2]: URL\n```")
											clearTimeout(t_out)
											t_out=setTimeout(function(){
												msg.channel.send("Response period ended: took too long to respond")
												collector.stop()
											},10000);
											step=4;
											break;
										case "3":
											msg.channel.send("Dialog closed.")
											clearTimeout(t_out)
											collector.stop()
											break;
										default:
											rmsg.channel.send("Invalid choice. Please try again.")
											clearTimeout(t_out)
											t_out=setTimeout(function(){
												msg.channel.send("Response period ended: took too long to respond")
												collector.stop()
											},10000);
											break;
									}
									break;
							}
							break;
						case 4:
							switch(rmsg.content){
								case "1":
								msg.channel.send("Give me a new name")
								clearTimeout(t_out);
								t_out=setTimeout(function(){
									msg.channel.send("Response period ended: took too long to respond")
									collector.stop()
								},10000);
								step=5;
								ch=1;
									break;
								case "2":
								msg.channel.send("Give me a new url")
								clearTimeout(t_out);
								t_out=setTimeout(function(){
									msg.channel.send("Response period ended: took too long to respond")
									collector.stop()
								},10000);
								step=5;
								ch=2;
									break;
							}
							break;
						case 5:
							switch(ch){
								case 1:
									client.query(`SELECT * FROM resources WHERE server_id='${rmsg.guild.id}' AND name='${rmsg.content}'`).then(tersc=>{
										tersc=tersc.rows[0];
										if(tersc){
											msg.channel.send("Resource with that name already exists! Please try again")
											clearTimeout(t_out);
											t_out=setTimeout(function(){
												msg.channel.send("Response period ended: took too long to respond")
												collector.stop()
											},10000);
										} else {
											client.query(`UPDATE resources SET name='${rmsg.content}' WHERE server_id='${rmsg.guild.id}' AND name='${renm}'`).then(()=>{
												msg.channel.send("Updated.")
												clearTimeout(t_out)
												collector.stop()
											})
										}
									})
									break;
								case 2:
									client.query(`SELECT * FROM resources WHERE server_id='${rmsg.guild.id}' AND url='${rmsg.content}'`).then(tersc=>{
										tersc=tersc.rows[0];
										if(tersc){
											msg.channel.send("Resource with that url already exists! Please try again")
											clearTimeout(t_out);
											t_out=setTimeout(function(){
												msg.channel.send("Response period ended: took too long to respond")
												collector.stop()
											},10000);
										} else {
											client.query(`UPDATE resources SET url='${rmsg.content}' WHERE server_id='${rmsg.guild.id}' AND name='${renm}'`).then(()=>{
												msg.channel.send("Updated.")
												clearTimeout(t_out)
												collector.stop()
											})
										}
									})
									break;
							}
							break;
					}
				})
				break;
			case "profile":

				if(args[1]=="help"){
					return	msg.channel.send(Texts.pfhelp);
				}

				var embed= new Discord.RichEmbed();
				var i;
				if(msg.mentions.users.size<1){
					i=msg.author;
				} else {
					i=msg.mentions.users.first();
				}
					client.query(`SELECT * FROM profiles WHERE user_id='${i.id}'`).then(gu=>{
						gu=gu.rows[0];
						if(gu){
							var tgs=[];
							client.query(`SELECT * FROM triggers WHERE user_id='${i.id}'`,(err,res)=>{
								if(err){
									console.log(err)
								}
								res.rows.forEach(function(row){
									tgs.push(`${row.name}: ${row.code}`)
								})
							})
						var lve=gu.level;
						var exp=gu.exp;


						setTimeout(function(){
							embed.setAuthor(`${i.username}`,`${i.avatarURL}`,`${i.avatarURL}`)
							embed.setThumbnail(`${i.avatarURL}`)
							embed.setTitle(`Title: ${gu.ct}`)
							embed.setDescription(`Bio: ${gu.bio}`)
							embed.setColor(6705259)
							embed.addField("Level:",`${lve}`)
							embed.addField("Exp:",`${exp}`)
							embed.addField("Exp to next level:",`${(Math.pow(eval(lve),2)+100)-exp}`)
							embed.addField("Cash:",`${gu.money}`)
							embed.addField("Trigger codes:",`${(tgs.length<1 ? "none" : tgs.join("\n"))}`)
							embed.setFooter("My name's Steve! Beep boop!","https://cdn.discordapp.com/avatars/300972723834847243/952373cf4a3bd95c5134d32455bf1e49.png")
							msg.channel.send({embed}).catch(error=>{
							if(error){
								msg.channel.send(`**${i.username}**\nAvatar: ${i.avatarURL}\n\nTitle: ${gu.ct}\nBio: ${gu.bio}\n\nLevel: ${lve[0]}\nExp: ${lve[1]}\nExp to next level: ${(Math.pow(eval(lve[0]),2)+100)-lve[1]}\nCash: ${gu.money}\n\nTrigger codes: ${tgs}`)
							}
						})},500)
					} else {
						msg.channel.send("That user has not been indexed yet.")
						return;
					}
				})

				if(i.id==msg.author.id){
					msg.channel.send("```Type 1 to enter edit menu.```")
					const collector=new Discord.MessageCollector(msg.channel,m=>m.author.id===msg.author.id);
					var pfstep=1;
					var pfch=0;
					var pft_out=setTimeout(function(){
						collector.stop()
					},10000)
					collector.on("collect",pemsg=>{
						switch(pfstep){
							case 1:
								switch(pemsg.content){
									case "1":
										msg.channel.send("```\nWhat would you like to edit?\n\n[1]: Title\n[2]: Bio```")
										clearTimeout(pft_out)
										pft_out=setTimeout(function(){
											msg.channel.send("Dialog closed: took too long to respond")
											collector.stop()
										},10000)
										pfstep=2;
										break;
									default:
										clearTimeout(pft_out)
										collector.stop()
										break;
								}
								break;
							case 2:
								switch(pemsg.content){
									case "1":
										msg.channel.send("Type new title.")
										clearTimeout(pft_out)
										pft_out=setTimeout(function(){
											msg.channel.send("Dialog closed: took too long to respond")
											collector.stop()
										},20000)
										pfstep=3;
										pfch=1;
										break;
									case "2":
										msg.channel.send("Type new bio.")
										clearTimeout(pft_out)
										pft_out=setTimeout(function(){
											msg.channel.send("Dialog closed: took too long to respond")
											collector.stop()
										},20000)
										pfstep=3;
										pfch=2;
										break;
									default:
										break;
								}
								break;
							case 3:
								switch(pfch){
									case 1:
										client.query(`UPDATE profiles SET ct='${pemsg.content}' WHERE user_id='${pemsg.author.id}'`).then(()=>{
											msg.channel.send("Profile updated!")
											clearTimeout(pft_out)
											collector.stop()
										})
										break;
									case 2:
										client.query(`UPDATE profiles SET bio='${pemsg.content}' WHERE user_id='${pemsg.author.id}'`).then(()=>{
											msg.channel.send("Profile updated!")
											clearTimeout(pft_out)
											collector.stop()
										})
										break;
								}
								break;
						}
					})
				}
				break;
			case "notes":
				var ns=new Discord.RichEmbed;
				var ntis=[];
				ns.setTitle("Notes")
				ns.setColor("#aaffff")
				client.query(`SELECT * FROM notepad WHERE user_id='${msg.author.id}'`,(err,res)=>{
					if(err){
						console.log(err)
					}
					res.rows.forEach(function(row){
						ntis.push(row.title)
					})

					ns.addField("\u200B",(ntis.length > 0 ? ntis.join("\n") : "[no notes]"))
					msg.channel.send({embed:ns})
					const collector=new Discord.MessageCollector(msg.channel,m=>m.author.id===msg.author.id);
					msg.channel.send((ntis.length > 0 ? "`Choose a name to view a note, type 'add new' to add a new note, or type 'cancel' to cancel.`" : "`Type 'add new' to add a new note or 'cancel' to cancel.`"))
					var nstep=1;
					var nch=0;
					var nt_out=setTimeout(function(){
						msg.channel.send("Dialog closed; took too long to respond.")
						collector.stop()
					},15000)
					var nnme="";

					collector.on("collect",nmsg=>{
						switch(nstep){
							case 1:
								if(nmsg.content.toLowerCase()=="add new"){
									msg.channel.send("What should the title be?")
									clearTimeout(nt_out)
									nt_out=setTimeout(function(){
										nmsg.channel.send("Dialog closed; took too long to respond.")
										collector.stop()
									},60000)
									nstep=2;
									nch=2;
								} else if(nmsg.content.toLowerCase()=="cancel"){
									clearTimeout(nt_out)
									nmsg.channel.send("Dialog closed.")
									collector.stop();
								} else {
									client.query(`SELECT * FROM notepad WHERE user_id='${nmsg.author.id}' AND title='${nmsg.content}'`).then(gnote=>{
										gnote=gnote.rows[0];
										if(gnote){
											nnme=gnote.title;
											var nnt=new Discord.RichEmbed;
											nnt.setTitle(gnote.title)
											nnt.setDescription(gnote.note)
											nnt.addField("Options:","```\n[1]: Edit\n[2]: Remove\n[3]: Close```")
											msg.channel.send({embed:nnt})
											clearTimeout(nt_out)
											nt_out=setTimeout(function(){
												nmsg.channel.send("Dialog closed; took too long to respond.")
												collector.stop()
											},10000)
											nstep=2;
											nch=1;
										} else {
											nmsg.channel.send("Note not found. Try again.")
											clearTimeout(nt_out)
											nt_out=setTimeout(function(){
												nmsg.channel.send("Dialog closed; took too long to respond.")
												collector.stop()
											},30000)
										}
									})
								}
								break;
							case 2:
								switch(nch){
									case 1:
										switch(nmsg.content){
											case "1":
												nmsg.channel.send("```\nEdit what?\n\n[1]: Title\n[2]: Note```")
												clearTimeout(nt_out)
												nt_out=setTimeout(function(){
													nmsg.channel.send("Dialog closed; took too long to respond.")
													collector.stop()
												},10000)
												nstep=3;
												nch=1;
												break;
											case "2":
												client.query(`DELETE FROM notepad WHERE user_id='${nmsg.author.id}' AND title='${nnme}'`).then(()=>{
													nmsg.channel.send("Deleted.")
													clearTimeout(nt_out)
													collector.stop()
												})
												break;
											case "3":
												nmsg.channel.send("Dialog closed.")
												clearTimeout(nt_out)
												collector.stop()
												break;
											default:
												nmsg.channel.send("Invalid choice. Try again")
												clearTimeout(nt_out)
												nt_out=setTimeout(function(){
													nmsg.channel.send("Dialog closed; took too long to respond.")
													collector.stop()
												},10000)
										}
										break;
									case 2:
										client.query(`SELECT * FROM notepad WHERE user_id='${nmsg.author.id}' AND title='${nmsg.content}'`).then(ngg=>{
											ngg=ngg.rows[0];
											if(ngg){
												msg.channel.send("Note with that name already exists! Try again")
												clearTimeout(nt_out);
												nt_out=setTimeout(function(){
													nmsg.channel.send("Dialog closed; took too long to respond.")
													collector.stop()
												},60000)
											} else {
												nnme=nmsg.content;
												msg.channel.send("Title will be "+nnme+". Enter note body.")
												clearTimeout(nt_out);
												nt_out=setTimeout(function(){
													nmsg.channel.send("Dialog closed; took too long to respond.")
													collector.stop()
												},60000)
												nstep=3;
												nch=0;
											}
										})
										break;
								}
								break;
							case 3:
								switch(nch){
									case 0:
										client.query(`INSERT INTO notepad (user_id,title,note) VALUES ($1,$2,$3)`,[nmsg.author.id,nnme,nmsg.content]).then(()=>{
											nmsg.channel.send("Note added.");
											clearTimeout(nt_out)
											collector.stop()
										})
										break;
									case 1:
											switch(nmsg.content){
												case "1":
													nmsg.channel.send("Give me the new title")
													clearTimeout(nt_out);
													nt_out=setTimeout(function(){
														nmsg.channel.send("Dialog closed; took too long to respond.")
														collector.stop()
													},60000)
													nstep=4;
													nch=1;
													break;
												case "2":
													nmsg.channel.send("Give me the new content")
													clearTimeout(nt_out);
													nt_out=setTimeout(function(){
														nmsg.channel.send("Dialog closed; took too long to respond.")
														collector.stop()
													},60000)
													nstep=4;
													nch=2;
													break;
											}
										break;
								}
								break;
							case 4:
								switch(nch){
									case 1:
										client.query(`SELECT * FROM notepad WHERE user_id='${nmsg.author.id}' AND title='${nmsg.content}'`).then(nntg=>{
											nntg=nntg.rows[0];
											if(nntg){
												msg.channel.send("Note with that name already exists. Try again")
												clearTimeout(nt_out);
												nt_out=setTimeout(function(){
													nmsg.channel.send("Dialog closed; took too long to respond.")
													collector.stop()
												},60000)
											} else {
												client.query(`UPDATE notepad SET title='${nmsg.content}' WHERE user_id='${nmsg.author.id}' AND title='${nnme}'`).then(()=>{
													msg.channel.send("Updated.")
													clearTimeout(nt_out)
													collector.stop()
												})
											}
										})
										break;
										case 2:
											client.query(`UPDATE notepad SET note='${nmsg.content}' WHERE user_id='${nmsg.author.id}' AND title='${nnme}'`).then(()=>{
												msg.channel.send("Updated.")
												clearTimeout(nt_out)
												collector.stop()
											})
											break;
								}
								break;
						}
					})
				})
				break;
			case "daily":
				client.query(`SELECT * FROM profiles WHERE user_id='${msg.author.id}'`).then(usergot=>{
					usergot=usergot.rows[0];
					if(usergot.daily=="0"){
						client.query(`UPDATE profiles SET money=${usergot.money}+200 WHERE user_id='${msg.author.id}'`).then(()=>{
							client.query(`UPDATE profiles SET daily='1' WHERE user_id='${msg.author.id}'`).then(()=>{
								msg.channel.send(`${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}, you've received 200 bucks for today!`)
							})
						})
					} else if(usergot.daily=="1"){
						client.query(`UPDATE profiles SET money=${usergot.money}+150 WHERE user_id='${msg.author.id}'`).then(()=>{
							client.query(`UPDATE profiles SET daily='2' WHERE user_id='${msg.author.id}'`).then(()=>{
								msg.channel.send(`${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}, I can't give you much, but... Here's another 150! :)`)
							})
						})
					} else if(usergot.daily=="2"){
						client.query(`UPDATE profiles SET money=${usergot.money}+50 WHERE user_id='${msg.author.id}'`).then(()=>{
							client.query(`UPDATE profiles SET daily='3' WHERE user_id='${msg.author.id}'`).then(()=>{
								msg.channel.send(`${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}, um, well, you've gotten a daily twice today... But here, I can give 50 to you :D`)
							})
						})
					} else {
						msg.channel.send(`Sorry, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}, I can't give you anymore money... It's against the rules :disappointed:`);
					}
				});
				break;
			case "bank":
				client.query(`SELECT * FROM profiles WHERE user_id='${msg.author.id}'`).then(useg=>{
					useg=useg.rows[0];
					if(!useg) return msg.channel.send(`${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}, you have no money.`)
					msg.channel.send(`${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}, you have ${useg.money} bucks!`);
				});
				break;
			case "*":
				adminCommands(args[0]);
				break;
			case "ad":
				adminCommands(args[0]);
				break;
			case "role":
				if(args[0]!=undefined&&args[1]!=undefined){
					var rolear=args[1].split(",");
					var ar2=rolear.join(", ");
					var na=[];
					var nr=[];
					var ad=[];
					var rm=[];
					for(var x=0;x<rolear.length;x++){
						var rt=rolear[x].split("|");
						if(rt.length>1){
							rt=rt.join(" ");
						}
						var torl=msg.member;
						if(rnvals[rt]){
							client.query(`SELECT * FROM "${msg.guild.id}_roles" WHERE role_name='${rt}'`).then((rta)=>{
								rta=rta.rows[0];
								if(rta){
									if(args[0]=="add"){
										if(torl.roles.has(rta.role_id)){
											na.push(rta.role_name)
										} else {
											torl.addRole(rta.role_id);
											ad.push(rta.role_name)
										}
									} else if(args[0]=="remove"){
										if(torl.roles.has(rta.role_id)){
												torl.removeRole(rta.role_id);
												rm.push(rta.role_name)
										} else {
											nr.push(rta.role_name)
										}
									} else {
										msg.channel.send("Please type add or remove.")
									}
								} else {
									msg.channel.send("That role was not found.")
								}
							});
						} else if(bnvals[rt]){
							client.query(`SELECT * FROM bundles WHERE server_id='${msg.guild.id}' AND name='${rt}'`).then(bundle=>{
								bundle=bundle.rows[0];
								var rtaids=bundle.role_ids.split(",");
								if(args[0]=="add"){
									for(var ex=0;ex<rtaids.length;ex++){
										if(!torl.roles.has(rtaids[ex])) {
											var woot=msg.guild.roles.find(r => r.id == rtaids[ex]);
											torl.addRole(rtaids[ex]);
											ad.push(woot.name)
										} else {
											var darn=msg.guild.roles.find(r => r.id == rtaids[ex]);
											na.push(darn.name);
										}
									}
								} else if(args[0]=="remove") {
									for(var ex=0;ex<rtaids.length;ex++){
										if(torl.roles.has(rtaids[ex])) {
											var woot=msg.guild.roles.find(r => r.id == rtaids[ex]);
											torl.removeRole(rtaids[ex]);
											rm.push(woot.name)
										} else {
											var darn=msg.guild.roles.find(r => r.id == rtaids[ex]);
											nr.push(darn.name);
										}
									}
								}
							});
						}
					}
					setTimeout(function(){
						if(args[0]=="add"){
							if(ad[0]!=undefined||ad[0]!=null){
								msg.channel.send(`Added ${ad.join(", ")} to ${torl.user.username}`)
								if(na[0]!=undefined||na[0]!=null){
									msg.channel.send(`Did not add ${na.join(", ")} to ${torl.user.username}`)
								}
							}else {
								if(na[0]!=undefined||na[0]!=null){
									msg.channel.send(`Did not add ${na.join(", ")} to ${torl.user.username}`)
								} else {
									msg.channel.send("Did nothing.")
								}
							}
						} else if(args[0]=="remove") {
							if(rm[0]!=undefined||rm[0]!=null){
								msg.channel.send(`Removed ${rm.join(", ")} from ${torl.user.username}`)
								if(nr[0]!=undefined||nr[0]!=null){
									msg.channel.send(`Did not remove ${nr.join(", ")} from ${torl.user.username}`)
								}
							} else {
								if(nr[0]!=undefined||nr[0]!=null){
									msg.channel.send(`Did not remove ${nr.join(", ")} from ${torl.user.username}`)
								} else {
									msg.channel.send("Did nothing.")
								}
							}
						} else {
							return;
						}
					},1000)
				} else if(args[0]=="list"){
					var embed=new Discord.RichEmbed();
					var r=""+rnames.sort().join("\n")+"";
					var b=""+bnames.sort().join("\n")+"";
					if(r==""){
						r="None."
					}
					if(b==""){
						b="None."
					}
					embed.addField("\\~\\~\\* Available roles \\*\\~\\~",r)
					embed.addField("\\~\\~\\* Available bundles \\*\\~\\~",b)
					embed.setColor("#654069");
					msg.channel.send({embed}).catch(error=>{
						if(error){
							msg.channel.send("I cannot embed messages here, sorry.")
						}
					});
				} else {
					msg.channel.send(Texts.rolehelp)
				}
				break;
			case "roles":
				var embed=new Discord.RichEmbed();
				var r=""+rnames.sort().join("\n")+"";
				var b=""+bnames.sort().join("\n")+"";
				if(r==""){
					r="None."
				}
				if(b==""){
					b="None."
				}
				embed.addField("\\~\\~\\* Available roles \\*\\~\\~",r)
				embed.addField("\\~\\~\\* Available bundles \\*\\~\\~",b)
				embed.setColor("#654069");
				msg.channel.send({embed}).catch(error=>{
					if(error){
						msg.channel.send("I cannot embed messages here, sorry.")
					}
				});
				break;
			case "change":
				switch(args[0]){
					case "color":
						if(msg.guild.roles.find(r => r.name == msg.author.id)){
								msg.guild.roles.find(r => r.name == msg.author.id).setColor(args2[1]).catch(console.error)
								.then(()=>{
									if(!msg.member.roles.has(msg.guild.roles.find(r => r.name == msg.author.id).id) ){
										msg.member.addRole(msg.guild.roles.find(r => r.name == msg.author.id) );
									}
									msg.channel.send(`Changed ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}'s color to ${args2[1]}`);
								})
						} else {
							msg.guild.createRole({name:msg.author.id,color:args2[1]}).then(nR=>{
								msg.member.addRole(nR);
								msg.channel.send(`Changed ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}'s color to ${args2[1]}`)
							}).catch(console.error);
						}
						break;
					case "colour":
						if(msg.guild.roles.find(r => r.name == msg.author.id)){
								msg.guild.roles.find(r => r.name == msg.author.id).setColor(args2[1]).catch(console.error)
								.then(()=>{
									if(!msg.member.roles.has(msg.guild.roles.find(r => r.name == msg.author.id).id) ){
										msg.member.addRole(msg.guild.roles.find(r => r.name == msg.author.id) );
									}
									msg.channel.send(`Changed ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}'s color to ${args2[1]}`);
								})
						} else {
							msg.guild.createRole({name:msg.author.id,color:args2[1]}).then(nR=>{
								msg.member.addRole(nR);
								msg.channel.send(`Changed ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}'s color to ${args2[1]}`)
							}).catch(console.error);
						}
						break;
				}
				break;
			case "trigs":

				if(args[0]==undefined){
					var trtoe;
					msg.channel.send("```What would you like to do?\n\n[1] View a trigger set\n[2] Create a new set\n[3] Cancel```").then(tm=>{
						trtoe=tm;
					})
					const collector=new Discord.MessageCollector(msg.channel,m=>m.author.id===msg.author.id)
					var trstep=1;
					var trch=0;
					var trnb;
					var trnw;
					var trno;
					var trcurop;
					var trcurlist;
					var trnn;
					var trt_out=setTimeout(function(){
						msg.channel.send("Dialog closed; took too long to respond")
						collector.stop()
					},20000)
					collector.on("collect",trmsg=>{
						switch(trstep){
							case 1:
								switch(trmsg.content){
									case "1":
										trmsg.delete();
										trtoe.edit("Give me the code for the list")
										clearTimeout(trt_out)
										trt_out=setTimeout(function(){
											trmsg.channel.send("Dialog closed; took too long to respond")
											collector.stop()
										},20000)
										trstep=2;
										trch=1;
										break;
									case "2":
										trmsg.delete();
										trtoe.edit("Give me a name for the list")
										clearTimeout(trt_out)
										trt_out=setTimeout(function(){
											trmsg.channel.send("Dialog closed; took too long to respond")
											collector.stop()
										},20000)
										trstep=2;
										trch=2;
										break;
									case "3":
										trmsg.delete();
										trtoe.delete();
										trmsg.channel.send("Dialog closed.")
										clearTimeout(trt_out)
										collector.stop()
										break;
									default:
										trmsg.channel.send("Invalid choice! Try again.")
										clearTimeout(trt_out)
										trt_out=setTimeout(function(){
											trmsg.channel.send("Dialog closed; took too long to respond")
											collector.stop()
										},20000)
										break;
								}
								break;
							case 2:
								switch(trch){
									case 1:
										client.query(`SELECT * FROM triggers WHERE code='${trmsg.content.toLowerCase()}'`).then(trl=>{
											trl=trl.rows[0];
											if(trl){
												var trembed=new Discord.RichEmbed();
												trembed.setTitle(trl.name)
												trembed.setDescription(`Trigger code: ${trl.code}`)
												trembed.addField("Bad",trl.bad)
												trembed.addField("Okay",trl.okay)
												trembed.addField("Warn",trl.warn)
												trmsg.delete()
												trtoe.edit({embed:trembed})
												if(trmsg.author.id==trl.user_id){
													trmsg.channel.send("```OPTIONS\n\n[1] Edit\n[2] Delete\n[3] Close```").then(nmg=>{
														trtoe=nmg;
													})
													clearTimeout(trt_out)
													trt_out=setTimeout(function(){
														trmsg.channel.send("Dialog closed; took too long to respond")
														collector.stop()
													},20000)
													trcurlist=trl.code;
													trstep=3;
													trch=1;
												} else {
												clearTimeout(trt_out)
												collector.stop()
												}
											} else {
												trmsg.delete()
												msg.channel.send("Couldn't find that list.")
												clearTimeout(trt_out)
												trt_out=setTimeout(function(){
													trmsg.channel.send("Dialog closed; took too long to respond")
													collector.stop()
												},20000)
											}
										})
										break;
									case 2:
										trnn=trmsg.content;
										trmsg.delete();
										trtoe.edit("Type what should be in the BAD section.\nNote: Triggers are preferably comma separated.\nYou have two minutes before the dialog closes.")
										clearTimeout(trt_out)
										trt_out=setTimeout(function(){
											trmsg.channel.send("Dialog closed; took too long to respond")
											collector.stop()
										},120000)
										trstep=3;
										trch=2;
										break;
								}
								break;
							case 3:
								switch(trch){
									case 1:
										switch(trmsg.content){
											case "1":
												trmsg.delete();
												trtoe.edit("Type or paste new value for BAD. You have two minutes to do this.")
												clearTimeout(trt_out)
												trt_out=setTimeout(function(){
													trmsg.channel.send("Dialog closed; took too long to respond")
													collector.stop()
												},120000)
												trch=1;
												trstep=4;
												break;
											case "2":
												client.query(`DELETE FROM triggers WHERE code='${trcurlist}'`).then(()=>{
													trtoe.delete()
													trmsg.delete()
													trmsg.channel.send("Deleted. Dialog closed.")
												})
												clearTimeout(trt_out)
												collector.stop()
												break;
											case "3":
												trmsg.delete();
												trmsg.channel.send("Dialog closed.")
												clearTimeout(trt_out)
												collector.stop()
												break;
											default:
												trmsg.channel.send("Invalid choice! Try again.")
												clearTimeout(trt_out)
												trt_out=setTimeout(function(){
													trmsg.channel.send("Dialog closed; took too long to respond")
													collector.stop()
												},20000)
												break;
										}
										break;
									case 2:
										trmsg.delete();
										trtoe.edit("Type what should be in the OKAY section.\nNote: Triggers are preferably comma separated.\nYou have two minutes before the dialog closes.")
										trnb=trmsg.content;
										clearTimeout(trt_out)
										trt_out=setTimeout(function(){
											trmsg.channel.send("Dialog closed; took too long to respond")
											collector.stop()
										},120000)
										trstep=4;
										trch=2;
										break;
								}
								break;
							case 4:
								switch(trch){
									case 1:
										trmsg.delete();
										trtoe.edit("Type or paste new value for OKAY. You have two minutes to do this.")
										trnb=trmsg.content;
										clearTimeout(trt_out)
										trt_out=setTimeout(function(){
											trmsg.channel.send("Dialog closed; took too long to respond")
											collector.stop()
										},120000)
										trch=1;
										trstep=5;
										break;
									case 2:
										trmsg.delete();
										trtoe.edit("Type what should be in the WARN section.\nNote: Triggers are preferably comma separated.\nYou have two minutes before the dialog closes.")
										trno=trmsg.content;
										clearTimeout(trt_out)
										trt_out=setTimeout(function(){
											trmsg.channel.send("Dialog closed; took too long to respond")
											collector.stop()
										},120000)
										trstep=5;
										trch=2;
										break;
								}
								break;
							case 5:
								switch(trch){
									case 1:
										trmsg.delete();
										trtoe.edit("Type or paste new value for WARN. You have two minutes to do this.")
										trno=trmsg.content;
										clearTimeout(trt_out)
										trt_out=setTimeout(function(){
											trmsg.channel.send("Dialog closed; took too long to respond")
											collector.stop()
										},120000)
										trch=1;
										trstep=6;
										break;
									case 2:
										trmsg.delete();
										var cd=genCode();
										client.query(`INSERT INTO triggers (user_id,code,bad,okay,warn,name) VALUES ($1,$2,$3,$4,$5,$6)`,[trmsg.author.id,cd,trnb,trno,trmsg.content,trnn]).then(()=>{
											trmsg.channel.send("List created. Code: "+cd+"\nDialog closed.")
											clearTimeout(trt_out)
											collector.stop();
										})
										break;
								}
								break;
							case 6:
								trmsg.delete();
								trtoe.delete();
								msg.channel.send(trcurlist)
								client.query(`SELECT * FROM triggers WHERE code='${trcurlist}'`).then(tltd=>{
									tltd=tltd.rows[0];
									let tmpn=tltd.name;
									setTimeout(function(){
										client.query(`DELETE FROM triggers WHERE code='${trcurlist}'`).then(()=>{
											client.query(`INSERT INTO triggers (user_id,code,bad,okay,warn,name) VALUES ($1,$2,$3,$4,$5,$6)`,[trmsg.author.id,trcurlist,trnb,trno,trmsg.content,tmpn])
										})
										msg.channel.send("List updated.")
										clearTimeout(trt_out)
										collector.stop()
									},500)

								})
								break;
						}
					})
				} else {
					client.query(`SELECT * FROM triggers WHERE code='${args[0]}'`).then(gtl=>{
						gtl=gtl.rows[0];
						if(gtl){
							var trgb=new Discord.RichEmbed;
							trgb.setTitle(gtl.name)
							trgb.setDescription(`Trigger code: ${gtl.code}`)
							trgb.addField("Bad",gtl.bad)
							trgb.addField("Okay",gtl.okay)
							trgb.addField("Warn",gtl.warn)
							msg.channel.send({embed:trgb})
						} else {
							msg.channel.send("List does not exist.")
						}
					})
				}
			 break;
			case "date":
				var d=new Date();
				msg.channel.send("Today's date is "+(d.getMonth()+1)+"/"+d.getDate()+"/"+d.getFullYear()+".");
				break;

			/********************************************************************* FUN **************************************************************************************
			********** Currently contains:
			********** -Assassinate
			********** -Vore
			********** -Oof
			********** -Emojify
			********** -Flip
			********** -Random
			********** -You/you're/youre gay/cute/adorable
			********** -What's/whats up
			********** -Good morning/night
			******************************************************************************************************************************************************************/

			case "assassinate":
				if(args[0]=="trump"){
					msg.channel.send("I would if I could, but I can't. I'm but a program running on just one computer.")
				}
				if(args[0]=="tats"||args[0]=="tatsumaki"){
					msg.channel.send("*There can only be one.*")
				}
				if(args[0]=="wizard"){
					msg.channel.send("Tell that bot I'm coming for him.")
				}
				break;
			case "vore":
				msg.channel.send(randomText(Texts.vore));
				break;
			case "oof":
				msg.channel.send(randomText(Texts.oof));
				break;
			case "oob":
				msg.channel.send(Texts.oof[3]);
				break;
			case "yikes":
				msg.channel.send(randomText(Texts.yikes))
				break;
			case "gay":
				msg.channel.send(randomText(Texts.gay))
				break;
			case "valid":
				var vt=randomText(Texts.valid)
				if(vt==":va::lid:"){
					return msg.channel.send(`${vaemo}${lidemo}`)
				} else if(vt==":valid:"){
					return msg.channel.send(`${validemo}`)
				}else {
					return msg.channel.send(vt)
				}
				break;
			case "fool":
				let ft=randomText(Texts.fool)
				if(ft==":hypereyes:"){
					return msg.channel.send(`${hye}`)
				} else {
					return msg.channel.send(ft)
				}
				break;
			case "emojify":
				msg.channel.send("Generating...")
				setTimeout(function(){msg.channel.startTyping()},50);


				var words=[];
				for(var x=0;x<args.length;x++){
					var chars=args[x].split("");
					var emotes=[];
					for(var n=0;n<chars.length;n++){
						if(/[a-z]/.test(chars[n])){
							emotes.push(`:regional_indicator_${chars[n]}:`)
						} else if(chars[n]=="?"){
							emotes.push(":question:")
						} else if(chars[n]=="!"){
							emotes.push(":exclamation:")
						}

					}
					if(emotes.length>1){
						words.push(emotes.join(" "));
					} else {
						words.push(emotes)
					}

				}
				setTimeout(function(){
					if(words.length>1){
						msg.channel.send(words.join("\n"))
						msg.channel.stopTyping();
					} else {
						msg.channel.send(words);
						msg.channel.stopTyping();
					}
				},750);
				break;
			case "flip":
				var num=Math.floor(Math.random() * 2);
				if(num==1){
					msg.channel.send("You flipped:\n:o:\nHeads!")
				} else {
					msg.channel.send("You flipped:\n:x:\nTails!")
				}
				break;
			case "random":
				if(args[0]!=undefined){
					if(!isNaN(args[0])){
						var max=args[0];
						var num=Math.floor(Math.random() * max);
						var nums=num.toString().split("");
						var done="";
						for(var x=0;x<nums.length;x++){
							nums[x]=":"+Texts.numbers[eval(nums[x])]+":";
						}
						msg.channel.send("Generating...");
						done=nums.join("");
						setTimeout(function(){msg.channel.send("Your number:\n"+done)},1000);
					} else {
						msg.channel.send("That's not a number!")
					}

				} else {
					return msg.channel.send("Please give a maximum number.")
				}
				break;
			case "you":
				if(args[0]=="are"){
					switch(args[1]){
						case "gay":
						msg.channel.send("Yes. Yes I am. We all are. Thank you for noticing :purple_heart:");
						break;
						case "adorable":
						msg.channel.send("D'aww, thank you so much! You're adorable, too :purple_heart:");
						break;
						case "cute":
						msg.channel.send("Oh, I'm not so sure about that... But you're definitely cute! :purple_heart:")
						break;
						default:
						msg.channel.send("I'm what now?");
						break;
					}
				} else {
					msg.channel.send("Hmm?");
				}
				break;
			case "you're":
				switch(args[0]){
					case "gay":
					msg.channel.send("Yes. Yes I am. We all are. Thank you for noticing :purple_heart:");
					break;
					case "adorable":
					msg.channel.send("D'aww, thank you so much! You're adorable, too :purple_heart:");
					break;
					case "cute":
					msg.channel.send("Oh, I'm not so sure about that... But you're definitely cute! :purple_heart:")
					break;
					default:
					msg.channel.send("I'm what now?");
					break;
				}
				break;
			case "youre":
				switch(args[0]){
					case "gay":
					msg.channel.send("Yes. Yes I am. We all are. Thank you for noticing :purple_heart:");
					break;
					case "adorable":
					msg.channel.send("D'aww, thank you so much! You're adorable, too :purple_heart:");
					break;
					case "cute":
					msg.channel.send("Oh, I'm not so sure about that... But you're definitely cute! :purple_heart:")
					break;
					default:
					msg.channel.send("I'm what now?");
					break;
				}
				break;
			case "what's":
				if(args[0]=="up"||args[0]=="up?"){

					msg.channel.send(randomText(Texts.wass));

				} else {
					msg.channel.send("Hmm?")
				}
				break;
			case "whats":
				if(args[0]=="up"||args[0]=="up?"){

					msg.channel.send(randomText(Texts.wass));
				} else {
					msg.channel.send("Hmm?")
				}
				break;
			case "good":
				if(args[0]=="night"){
					msg.channel.send(`Goodnight, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}. Sweet dreams and sleep well :purple_heart:`);
				} else if(args[0]=="morning") {
					msg.channel.send(`Good morning, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}! I hope you're having a good day so far :)`)
				}
				break;

			/****************************************************************** AFFIRMING ******************************************************************************
			********** Currently contains:
			********** -Lovebomb
			********** -Am I real? Am I crazy?
			********** -I/we love you
			********** -I'm/im gay
			*******************************************************************************************************************************************************************/

			case "lovebomb":
				var lb=0;
				setInterval(() => {
					if(lb==5){
						clearInterval();
					} else {
						msg.channel.send(toLit(Texts.lovebombs[lb],"msg.author.username","${msg.author.username}"));
						lb=lb+1;
					}
				},1000);
				break;
			case "am":
				if(args[0]=="i"&&(args[1]=="real"||args[1]=="real?")){
					msg.channel.send("You are more than definitely real. Nothing you're going through is fake.\nDon't take the words that others say with much substance. They don't know you.\nOnly you know you.\nYou deserve better, and you are definitely real.")
				}
				if(args[0]=="i"&&(args[1]=="crazy"||args[1]=="crazy?")){
					msg.channel.send(`No, ${msg.author.username}. You're not crazy at all. Sometimes we can feel like we are, but really, you're just going through a very complex time right now.\nRemember to take breaks, they can help.\nAlso remember that we love you! :purple_heart:`)
				}
				break;
			case "i":
				if(args[0]=="love"&&args[1]=="you"){
					if(msg.author.id=="248290631640678400"){
						msg.channel.send("I love you, too, dad!")
					} else {
						msg.channel.send(`I love you, too, ${(msg.member.nickname==null ? msg.author.username : msg.member.nickname)}!`)
					}

				} else {
					msg.channel.send("Sorry, I didn't quite catch that.");
				}
				if(args[0]=="am"){
					if(args[1]=="gay"){
						if(args[0]=="gay"){
							msg.channel.send("I am, too!\n:gay_pride_flag::regional_indicator_g: :a: :regional_indicator_y: :regional_indicator_p: :regional_indicator_r: :regional_indicator_i: :regional_indicator_d: :regional_indicator_e::gay_pride_flag:")
						}
					}
				}
				break;
			case "we":
				if(args[0]=="love"&&args[1]=="you"){
					if(msg.author.id=="248290631640678400"){
						msg.channel.send("I love you, too, parents!")
					} else {
						msg.channel.send(`I love y'all, too, ${msg.author.username}!`)
					}

				} else {
					msg.channel.send("Sorry, I didn't quite catch that.");
				}
				if(args[0]=="are"){
					if(args[1]=="gay"){
						if(args[0]=="gay"){
							msg.channel.send("I am, too!\n:gay_pride_flag::regional_indicator_g: :a: :regional_indicator_y: :regional_indicator_p: :regional_indicator_r: :regional_indicator_i: :regional_indicator_d: :regional_indicator_e::gay_pride_flag:")
						}
					}
				}
				break;
			case "im":
				if(args[0]=="gay"){
					let gresp=randomText(Texts.imgay)
					if(gresp==":gay:"){
						msg.channel.send(`${gaye}`)
					} else {
						console.log(gresp)
						setTimeout(function(){msg.channel.send(gresp)},200)
					}
				}
				if(args[0]=="lesbian"){
					let lresp=randomText(Texts.imlesbian)
					if(lresp==":valid:"){
						msg.channel.send(`${validemo}`)
					} else {
						console.log(lresp)
						setTimeout(function(){msg.channel.send(lresp)},200)
					}
				}
				if(args[0]=="ace"){
					let aresp=randomText(Texts.imace)
					if(aresp==":valid:"){
						msg.channel.send(`${validemo}`)
					} else {
						console.log(aresp)
						setTimeout(function(){msg.channel.send(aresp)},200)
					}
				}
				break;
			case "i'm":
				if(args[0]=="gay"){
					let gresp=randomText(Texts.imgay)
					if(gresp==":gay:"){
						msg.channel.send(`${gaye}`)
					} else {
						console.log(gresp)
						setTimeout(function(){msg.channel.send(gresp)},200)
					}
				}
				if(args[0]=="lesbian"){
					let lresp=randomText(Texts.imlesbian)
					if(lresp==":valid:"){
						msg.channel.send(`${validemo}`)
					} else {
						console.log(lresp)
						setTimeout(function(){msg.channel.send(lresp)},200)
					}
				}
				if(args[0]=="ace"){
					let aresp=randomText(Texts.imace)
					if(aresp==":valid:"){
						msg.channel.send(`${validemo}`)
					} else {
						console.log(aresp)
						setTimeout(function(){msg.channel.send(aresp)},200)
					}
				}
				break;

			//***************************************************************************** END ***************************************************************************

			case undefined:
				return;
				break;
			default:
				msg.channel.send("That did not compute.")
				break;
		}
		//msg.channel.send("Run commands done")
	}
	function executeThings(){
		let thisProm= new Promise((resolve,reject)=>{
			setTimeout(function(){setupCommands();
				resolve(command)},250);
		});

		thisProm.then((command)=>{
			if(confs[msg.guild.id].disabled.includes(command)){
				msg.channel.send("That command is disabled.")
			} else{
				runCommand(command);
			}
		})
	};
	if(!msg.author.bot){
		console.log(msg.author.username)
		setupConfigs(msg.guild.id);
		setupUser(msg.guild.id,msg.author.id);
		setupProfile(msg);
		setupRoles();
		setupFeedback();
		postThings(msg);
		setTimeout(function(){
			if(msg.content.toLowerCase().startsWith("oof") && !confs[msg.guild.id].disabled.includes("oof")){
				return msg.channel.send(randomText(Texts.oof));
			}
			if(msg.content.toLowerCase().startsWith("oob") && !confs[msg.guild.id].disabled.includes("oof")){
				return msg.channel.send(Texts.oof[3]);
			}
			if(msg.content.toLowerCase().startsWith("yikes") && !confs[msg.guild.id].disabled.includes("yikes")){
				return msg.channel.send(randomText(Texts.yikes))
			}
			if(msg.content.toLowerCase().startsWith("gay") && !confs[msg.guild.id].disabled.includes("gay")){
				return msg.channel.send(randomText(Texts.gay))
			}
			if(msg.content.toLowerCase().startsWith("valid") && !confs[msg.guild.id].disabled.includes("valid")){
				var vt=randomText(Texts.valid)
				if(vt==":va::lid:"){
					return msg.channel.send(`${vaemo}${lidemo}`)
				} else if(vt==":valid:"){
					return msg.channel.send(`${validemo}`)
				}else {
					return msg.channel.send(vt)
				}

			}
			if(msg.content.toLowerCase().startsWith("fool") && !confs[msg.guild.id].disabled.includes("fool")){
				let ft=randomText(Texts.fool)
				if(ft==":hypereyes:"){
					return msg.channel.send(`${hye}`)
				} else {
					return msg.channel.send(ft)
				}

			}
		},100)
	}
	setTimeout(function(){
	executeThings();
	},250)

	} else {
		console.log(msg.author.username)
		setupProfile(msg);
		setupFeedback();
		dmStuff(msg);
	}

setInterval(function(){dailyReset()},60000);
});
