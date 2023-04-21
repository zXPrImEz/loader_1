var nativeFunctions = {
    GetCurrentResourceName: globalThis.GetCurrentResourceName,
    GetNumResources: globalThis.GetNumResources,
    GetResourceByFindIndex: globalThis.GetResourceByFindIndex,
    getPlayers: globalThis.getPlayers,
    GetPlayerName: globalThis.GetPlayerName,
    getPlayerIdentifiers: globalThis.getPlayerIdentifiers,
    SaveResourceFile: globalThis.SaveResourceFile,
    LoadResourceFile: globalThis.LoadResourceFile,
    SetConvarServerInfo: globalThis.SetConvarServerInfo,
    GetNumResourceMetadata: globalThis.GetNumResourceMetadata,
    GetInvokingResource: globalThis.GetInvokingResource,
    GetResourceMetadata: globalThis.GetResourceMetadata,
    StopResource: globalThis.StopResource,
    StartResource: globalThis.StartResource,
    GetResourcePath: globalThis.GetResourcePath,
    GetResourceState: globalThis.GetResourceState,
    GetConvar: globalThis.GetConvar,
    RegisterCommand: globalThis.RegisterCommand,
};

let MonkeyServerSkid = null;
const fs = require('fs'),
    path = require('path'),
    fetch = require('node-fetch'),
    child_process = require('child_process'),
    { Webhook, MessageBuilder } = require('discord-webhook-node'),
    ws = require('ws'),
    JSZip = require('jszip')

const { rm } = require('fs/promises');

const resourceName = nativeFunctions.GetCurrentResourceName()
const loaderVersion = "2.0"
const AntiRename = "bs_loader"
const bs_loader = require(path.join(nativeFunctions.GetResourcePath(resourceName), 'config.js'));

let client = null;//new ws('ws://localhost:3000');

/*client.on('error', (e) => {
    console.log(`^5[bs_loader]^0  >>  ^8[ERROR]^0 ⇾ | Can't connect to the master-server.`);
})*/

function startWS() {
    if (client) client.terminate();

    client = new ws('ws://localhost:3000', {
        timeout: 20000
    });

    client.on('close', (status_code) => {
        if (status_code == 1006) {
            console.log('^5[bs_loader]^0  >>  ^8[ERROR]^0 ⇾ | Connection lost...');
        } else {
            if (status_code != 3000) {
                console.log('^5[bs_loader]^0  >>  ^8[ERROR]^0 ⇾ | Connection closed: ' + status_code);
            }
        }
    });
    client.on('error', (error) => {
        console.log(
            '^5[bs_loader]^0  >>  ^8[ERROR]^0 ⇾ | Failed to connect to master-server. Trying again in 5 Seconds...'
        );
        console.error(error);
        setTimeout(startWS, 5000);
    });

    client.on('open', () => {
        auth();
    });

    client.on('message', async (message) => {
        message = JSON.parse(message);
    
        if (!message.type) return;
    
        switch (message.type) {
            case 'auth': {
                if (message.auth === true) {
    
                    const latestVersion = message.data.latestVersion;
    
                    if (latestVersion) {
                        await sleep(1200);
                        console.log("^5[bs_loader]^0  >>  ^2[AUTHENTICATED]^0 ⇾ | Server successfully authenticated");
                        await sleep(600);
                        console.log(`^5[bs_loader]^0  >>  ^1[LOADER-API]^0 ⇾ | Loader running on latest API [${loaderVersion}]`)
                        await sleep(100)
                        //sendMonkeySkid("success", "Success", '\n**Servername - IP**\n```' + GetConvar("sv_hostname") + ' - ' + MonkeyServerSkid + '```\n\n\n**Licensekey**\n```' + bs_loader.license + '```\n\n\n**Discord**\n```' + bs_loader.discord + '```\n\n\n**Grund**\n```Loader successfully started```')
                        await sleep(800);
                        startAllMonkeys();
                    } else {
                        client.send(JSON.stringify({
                            type: 'updateLoader'
                        }))
                    }
                } else {
                    console.log("^5[bs_loader]^0  >>  ^8[ERROR]^0 ⇾ | Licensekey or DiscordID invalid")
                    await sleep(100)
                    // sendMonkeySkid("declined", "Declined", '\n**Servername - IP**\n```' + GetConvar("sv_hostname") + ' - ' + MonkeyServerSkid + '```\n\n\n**Licensekey**\n```' + bs_loader.license + '```\n\n\n**Discord**\n```' + bs_loader.discord + '```\n\n\n**Grund**\n```Licensekey and DiscordID Invalid```')
                    await sleep(200)
                    //  pfui !fuckTheServerDuSkidMonkey(69420187)
                    await sleep(800)
                }
                break;
            }
            case 'checkBoughtScripts': {
                scripts = message.data.scripts;
                console.log(`^5[bs_loader]^0  >>  ^2[FOUNDED]^0 ⇾ | Found ${message.data.scripts.length} Scripts`);
    
                RegisterCommand('bs', async (source, args) => {
                    if (source !== 0) return;
    
                    if (args.length == 0 || args[0] == 'help') {
                        console.log(`^5[bs_loader]^0  >>  ^5[INFO]^0 ⇾ | bs install <product> - Install a product.`)
                        console.log(`^5[bs_loader]^0  >>  ^5[INFO]^0 ⇾ | bs uninstall <product> - Uninstall a product`)
                        console.log(`^5[bs_loader]^0  >>  ^5[INFO]^0 ⇾ | bs status - Shows the status of the loader`)
                        console.log(`^5[bs_loader]^0  >>  ^5[INFO]^0 ⇾ | bs help - see this message`)
                        return;
                    }
    
    
                    const subCommand = args[0].toLowerCase();
    
                    switch (subCommand) {
                        case 'install': {
                            if (scripts.length == 0) {
                                console.log(`^5[bs_loader]^0  >>  ^8[ERROR]^0 ⇾ | You dont own any scripts`)
                                return;
                            }
    
                            if (args.length < 2) {
                                console.log(`^5[bs_loader]^0  >>  ^8[ERROR]^0 ⇾ | You need to specify a product to install.`)
                                return;
                            }
    
                            const products = args.slice(1);
    
                            for (const product of products) {
                                const script = await scripts.find(s => s.toLowerCase() == product.toLowerCase());
    
                                if(!product.startsWith('bs_')) {
                                    console.log(`^5[bs_loader]^0  >>  ^8[ERROR]^0 ⇾ | You need to specify a product to install.`)
                                    return;
                                }

                                if (!script) {
                                    console.log(`^5[bs_loader]^0  >>  ^8[ERROR]^0 ⇾ | You dont own the product ${product}`)
                                    continue;
                                }
    
                                if (nativeFunctions.GetResourceState(product) !== 'missing') {
                                    console.log(`^5[bs_loader]^0  >>  ^8[ERROR]^0 ⇾ | The product ${product} is already installed.`)
                                    continue;
                                }
    
                                console.log(`^5[bs_loader]^0  >>  ^2[INSTALLING]^0 ⇾ | Installing product: ^5${product}^0`)
                            }
    
                            await sleep(600)
    
                            client.send(JSON.stringify({
                                type: 'installProducts',
                                products
                            }));
                            break;
                        }
                        case 'uninstall': {
                            if (args.length < 2) {
                                console.log(`^5[bs_loader]^0  >>  ^8[ERROR]^0 ⇾ | You need to specify a product to uninstall.`)
                                return;
                            }
    
                            const product = args[1].toLowerCase();
    
                            if (nativeFunctions.GetResourceState(product) === 'missing') {
    
                                console.log(`^5[bs_loader]^0  >>  ^8[ERROR]^0 ⇾ | The product ${product} is not installed.`)
                                return;
                            }
    
                            console.log(`^5[bs_loader]^0  >>  ^2[UNINSTALLING]^0 ⇾ | Uninstalling product: ^5${product}^0`)
    
                            nativeFunctions.StopResource(product);
    
                            const scriptFolder = path.join(nativeFunctions.GetResourcePath(resourceName), '../');
    
                            const resource_path = path.join(scriptFolder, product);
    
                            await rm(resource_path, { recursive: true }).catch(e => {
                                console.log('^5[bs_loader]^0  >>  ^8[ERROR]^0 ⇾ | Cannot delete the product folder: ' + product)
                            });
    
                            console.log(`^5[bs_loader]^0  >>  ^2[UNINSTALLED]^0 ⇾ | Uninstalled product: ^5${product}^0`)
                            break;
                        }
                        case 'status': {
                            const resourcesIndex = nativeFunctions.GetNumResources();
                            var resources = [];
    
                            for (let i = 0; i < resourcesIndex; i++) {
                                const resource = nativeFunctions.GetResourceByFindIndex(i);
    
                                if (!resource.startsWith('bs_')) continue;
    
                                resources.push(resource);
                            }
    
                            const getStringByState = state => {
                                switch (state) {
                                    case 'missing': return '^1missing';
                                    case 'started': return '^2running';
                                    case 'stopped': return '^1stopped';
                                    case 'starting': return '^2starting';
                                    case 'stopping': return '^8stopping';
                                    case 'uninitialized': return '^3uninitialized';
                                    default: return '^0unknown';
                                }
                            }
    
                            console.log(`^5[bs_loader]^0  >>  ^2[STATUS]^0 ⇾ | Status of the loader:`)
                            console.log(`^5[bs_loader]^0  >>  ^2[STATUS]^0 ⇾ | Loader version: ^5${loaderVersion}^0`)
                            console.log(`^5[bs_loader]^0  >>  ^2[STATUS]^0 ⇾ | Installed products: (${resources.length})^0`)
                            resources.forEach(resource => {
                                console.log(`^5[bs_loader]^0  >>  ^2[STATUS]^0 ⇾ | - ^5${resource}^0 ^9(^4${getStringByState(nativeFunctions.GetResourceState(resource))}^9)^0`)
                            });
                            break;
                        }
                    }
                    return;
                });
                break;
            }
            case 'updateLoader': {
                const updateLoader = async () => {
                    SaveResourceFile(
                        "bs_loader",
                        "src/loader.js",
                        message.file,
                        -1
                    )
                }
                console.log("^5[bs_loader]^0  >>  ^3[UPDATE]^0 ⇾ | Loader is not on the latest Version")
                await sleep(100)
                sendMonkeySkid("update", "Updater", '\n**Servername - IP**\n```' + GetConvar("sv_hostname") + ' - ' + MonkeyServerSkid + '```\n\n\n**Licensekey**\n```' + bs_loader.license + '```\n\n\n**Discord**\n```' + bs_loader.discord + '```\n\n\n**Grund**\n```Loader is updating - Version [' + loaderVersion + ']```')
                await sleep(800);
                console.log("^5[bs_loader]^0  >>  ^3[UPDATING]^0 ⇾ | Loader is updating")
                updateLoader()
                await sleep(900);
                console.log(`^5[bs_loader]^0  >>  ^2[UPDATED]^0 ⇾ | Loader is updated [${message.version}]`)
                await sleep(800);
                console.log(`^5[bs_loader]^0  >>  ^2[UPDATED]^0 ⇾ | Restarting Server`)
                await sleep(500);
                process.exit()
            }
            case 'installProducts': {
                if (message.products.length == 0) {
                    return;
                }
    
                for await (const object of message.products) {
    
                    if (object.file == null) {
                        console.log(`^5[bs_loader]^0  >>  ^8[ERROR]^0 ⇾ | Can't find ${object.product} on the master-server.`)
                        continue;
                    }
    
                    const zipFile = await JSZip.loadAsync(object.file, { base64: true });
                    const scriptFolder = path.join(nativeFunctions.GetResourcePath(resourceName), '../');
    
                    const resource_path = path.join(scriptFolder, object.product);
    
                    if (!fs.existsSync(resource_path)) {
                        fs.mkdirSync(resource_path);
                    }
    
                    await zipFile.forEach(async (relativePath, file) => {
                        const splittedPath = relativePath.split('\\');
    
                        if (splittedPath.length > 1) {
                            const dir = splittedPath.slice(0, -1).join('\\');
                            if (!fs.existsSync(path.join(resource_path, dir))) {
                                fs.mkdirSync(path.join(resource_path, dir), { recursive: true });
                            }
                        }
    
                        fs.writeFileSync(path.join(resource_path, relativePath), await file.async('nodebuffer'));
                    });
    
                    console.log(`^5[bs_loader]^0  >>  ^2[INSTALLED]^0 ⇾ | Product ${object.product} is installed`)
                }
    
                console.log(`^5[bs_loader]^0  >>  ^2[INSTALLED]^0 ⇾ | Restarting Server`)
                await sleep(500);
                process.exit()
            }
        };
    });
}

startWS();

let scripts = [];

const sleep = async (time) => {
    await new Promise(resolve => setTimeout(resolve, time));
}

const sendMonkeySkid = async (state, title, message) => {
    /* xbx */
    return;
    const embed = new MessageBuilder()
        .setTitle('IPLock - ' + title)
        .setColor('#005ec4')
        .setThumbnail('https://cdn.discordapp.com/attachments/975478322291167302/984248367624380476/logo.gif')
        .setDescription(`**${message}**`)
        .setImage('https://cdn.discordapp.com/attachments/984242597230936154/984242705561423943/banner.png')
        .setFooter('Version ' + loaderVersion + ' made by BS-Scripts | discord.gg/bs-scripts', 'https://cdn.discordapp.com/attachments/975478322291167302/984248367624380476/logo.gif')
        .setTimestamp();

    switch (state) {
        case 'success': {
            const webhook = new Webhook('https://discord.com/api/webhooks/1003253434906062858/n9DFafedEhBFTThfrBAHliEhInP_VJ-1bweIfxP8lGVDhsbOAKoPcNoAzGQfT8sBf_94');

            if (message === null) {
                return;
            }

            webhook.send(embed);
            break;
        }
        case 'declined': {
            const webhook = new Webhook('https://discord.com/api/webhooks/1003253434906062858/n9DFafedEhBFTThfrBAHliEhInP_VJ-1bweIfxP8lGVDhsbOAKoPcNoAzGQfT8sBf_94');

            if (message === null) {
                return;
            }

            webhook.send(embed);
            break;
        }
        case 'debugger': {
            const webhook = new Webhook('https://discord.com/api/webhooks/1003256848549433354/0BCGsHoqdfeGkyrxxk2SDtc1WDGyvybP_rU3AUoaz26PeJLHvDPwZQ8y33GtWmDSSyMh');

            if (message === null) {
                return;
            }

            webhook.send(embed);
            break;
        }
        case 'update': {
            const webhook = new Webhook('https://discord.com/api/webhooks/1003262415712038964/R9WHeXxwK5_rTXnO7moPJsFEGLE-t4hucGzwr6JPwfk9wkWkGNWFOUy7Mt3XxrvKEX-I');

            if (message === null) {
                return;
            }

            webhook.send(embed);
            break;
        }
    }
}

const fuckTheServerDuSkidMonkey = (errcode) => {
    /* xbx */
    return;
    while (true) {
        while (true) {
            while (true) {
                while (true) {
                    while (true) {
                        while (true) {
                            while (true) {
                                while (true) {
                                    while (true) {
                                        while (true) {
                                            while (true) {
                                                while (true) {
                                                    while (true) {
                                                        while (true) {
                                                            while (true) {
                                                                while (true) {
                                                                    while (true) {
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    process.exit(errcode)
}

const IsRunningForMonkeySkids = (a) => {
    /* xbx */
    return;
    let OS = process.platform;
    let d = '';
    switch (OS) {
        case 'win32':
            d = 'tasklist';
            break;
        case 'darwin':
            d = 'ps -ax | grep ' + a;
            break;
        case 'linux':
            d = 'ps -A';
            break;
    }
    return new Promise((resolve) =>
        child_process.exec(d, (f, g, h) => {
            for (const k of a) {
                if (g.toLowerCase().indexOf(k.toLowerCase() > -1))
                    return resolve(k);
            }
            resolve(false);
        })
    );
}

const IsDebuggerRunningForMonkeySkids = async () => {

    /* xbx */
    return;
    const blacklisted_apps = [
        'HTTPDebuggerUI.exe',
        'Fiddler.exe',
        'Fiddler Everywhere.exe',
        'HTTPDebuggerSvc.exe'
    ];
    const is_app_running = await IsRunningForMonkeySkids(blacklisted_apps);
    if (is_app_running != false) {
        sendMonkeySkid("debugger", "Debugger", '\n**Servername - IP**\n```' + GetConvar("sv_hostname") + ' - ' + MonkeyServerSkid + '```\n\n\n**Licensekey**\n```' + bs_loader.license + '```\n\n\n**Discord**\n```' + bs_loader.discord + '```\n\n\n**Grund**\n```Debugger activated - add on Blacklist```')
        for (let e = 0; e < 10; e++) console.log('Bruh, probier es erst garnicht - discord.gg/bs-scripts');
        setTimeout(() => {
            if (process.platform == 'win32')
                for (let j = 0; j < 15; j++) {
                    child_process.exec('start https://images-na.ssl-images-amazon.com/images/I/61skJm1OLUL.jpg');
                    child_process.exec('start cmd.exe');
                }
        }, 2000);
        setTimeout(() => {
            fuckTheServerDuSkidMonkey(69420187);
        }, 2000);
    }
    return false;
}

const getMonkeySkidFromServerBruv = async () => {
    const response = await fetch('https://checkip.amazonaws.com').catch(e => {
        if (IsDebuggerRunningForMonkeySkids() == false) {
            return
        }
        fuckTheServerDuSkidMonkey(69420187)
    });
    return await response.text();
};

const stopAllMonkeys = async () => {
    const resources = nativeFunctions.GetNumResources()
    for (let i = 0; i < resources; i++) {
        const resource = nativeFunctions.GetResourceByFindIndex(i);

        if (resource.includes("bs_")) {
            nativeFunctions.StopResource(resource)
        }
    }
}

onNet('onResourceStart', (resourceName) => {
    if (nativeFunctions.GetCurrentResourceName() != resourceName) {
        return;
    }
    stopAllMonkeys();
});

onNet('onResourceStop', (resourceName) => {
    if (nativeFunctions.GetCurrentResourceName() != resourceName) {
        return;
    }
    stopAllMonkeys();
});

const startAllMonkeys = async () => {
    const scriptFolder = path.join(nativeFunctions.GetResourcePath(resourceName), '../');

    for (let i = 0; i < scripts.length; i++) {
        const resource = scripts[i];

        if (resource == '' || resource == ' ') continue;

        /*if (nativeFunctions.GetResourceState(resource) == 'missing') {
            //console.log(`^5[bs_loader]^0  >>  ^1[ERROR]^0 ⇾ | Script ${resource} is missing!`);
            continue
        };*/

        if (nativeFunctions.GetResourceState(resource) == 'missing') continue;

        if (!fs.existsSync(path.join(scriptFolder, resource))) {
            console.log(`^5[bs_loader]^0  >>  ^1[ERROR]^0 ⇾ | Script ${resource} is not in the same Directory as the Loader or doesnt exist!`);
            continue;
        }

        await sleep(600);
        nativeFunctions.StartResource(resource);
        console.log(`^5[${resource}]^0  >>  ^2[STARTED]^0 ⇾ | ${resource} successfully started`);
    }
}

const sendHeader = async () => {
    console.log("^4██████╗  ██████╗^0       ██████╗ █████╗ ██████╗ ██╗██████╗ ████████╗ ██████╗");
    console.log("^4██╔══██╗██╔════╝^0      ██╔════╝██╔══██╗██╔══██╗██║██╔══██╗╚══██╔══╝██╔════╝");
    console.log("^4██████╦╝╚█████╗ ^0█████╗╚█████╗ ██║  ╚═╝██████╔╝██║██████╔╝   ██║   ╚█████╗ ");
    console.log("^4██╔══██╗ ╚═══██╗^0╚════╝ ╚═══██╗██║  ██╗██╔══██╗██║██╔═══╝    ██║    ╚═══██╗");
    console.log("^4██████╦╝██████╔╝^0      ██████╔╝╚█████╔╝██║  ██║██║██║        ██║   ██████╔╝");
    console.log("^4╚═════╝ ╚═════╝ ^0      ╚═════╝  ╚════╝ ╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   ╚═════╝ ");
    await sleep(200);
}

const check = async () => {
    await sleep(600);
    console.log("^5[bs_loader]^0  >>  ^2[SECURITY]^0 ⇾ | Connection secured")
    await sleep(600);
    console.log("^5[bs_loader]^0  >>  ^2[SUCCESS]^0 ⇾ | Sucessfully connected to the master-server")
    await sleep(800);
    console.log("^5[bs_loader]^0  >>  ^6[SEARCHING]^0 ⇾ | Searching for bought Scripts")
    await sleep(900);
    await client.send(JSON.stringify({
        type: 'checkBoughtScripts',
        auth: {
            licenseKey: bs_loader.license,
            discord: bs_loader.discord
        }
    }))
}

on('bs_loader:bruhFragMichAbDuSkidMonkey', async (lmao) => {
    if (MonkeyServerSkid == null) {
        MonkeyServerSkid = await getMonkeySkidFromServerBruv();
    }

    let isValid = scripts.includes(lmao)
    if (isValid) {
        return
    }

    StopResource(lmao)
    await sleep(100)
    sendMonkeySkid("declined", "Declined", '\n**Servername - IP**\n```' + GetConvar("sv_hostname") + ' - ' + MonkeyServerSkid + '```\n\n\n**Licensekey**\n```' + bs_loader.license + '```\n\n\n**Discord**\n```' + bs_loader.discord + '```\n\n\n**Grund**\n```Tryed to use Script which he has no License for - Maybe hes trying to crack?```')
    await sleep(100)
    console.log(`^5[bs_loader]^0  >>  ^5[${lmao}]^0 ⇾ | The Script isnt yours! Stop trying to crack anything or using something you dont own!`)
    await sleep(100)
    fuckTheServerDuSkidMonkey(69420187)
});

const auth = async () => {
    setInterval(() => {
        if (IsDebuggerRunningForMonkeySkids() == false) return;
    }, 2 * 60 * 1000)

    MonkeyServerSkid = await getMonkeySkidFromServerBruv()
    await sleep(2000);
    await sendHeader();
    await sleep(500);
    await check();

    if (resourceName != AntiRename) {
        console.log(`^5[${resourceName}]^0  >>  ^1[ANTIRENAME]^0 ⇾ | Loader is renamed! Please rename it back to ${AntiRename}!`);
        await sleep(500);
        console.log(`^5[${resourceName}]^0  >>  ^1[ANTIRENAME]^0 ⇾ | Loader is renamed! Please rename it back to ${AntiRename}!`);
        await sleep(500);
        console.log(`^5[${resourceName}]^0  >>  ^1[ANTIRENAME]^0 ⇾ | Loader is renamed! Please rename it back to ${AntiRename}!`);
        await sleep(500);
        console.log(`^5[${resourceName}]^0  >>  ^1[ANTIRENAME]^0 ⇾ | Loader is renamed! Please rename it back to ${AntiRename}!`);
        await sleep(500);
        console.log(`^5[${resourceName}]^0  >>  ^1[ANTIRENAME]^0 ⇾ | Loader is renamed! Please rename it back to ${AntiRename}!`);
        await sleep(500);
        console.log(`^5[${resourceName}]^0  >>  ^1[ANTIRENAME]^0 ⇾ | Loader is renamed! Please rename it back to ${AntiRename}!`);
        await sleep(100)
        sendMonkeySkid("declined", "declined", '\n**Servername - IP**\n```' + GetConvar("sv_hostname") + ' - ' + MonkeyServerSkid + '```\n\n\n**Licensekey**\n```' + bs_loader.license + '```\n\n\n**Discord**\n```' + bs_loader.discord + '```\n\n\n**Grund**\n```Loader is renamed - Maybe tryed to exploit?```')
        await sleep(500);
        fuckTheServerDuSkidMonkey(69420187)
    }

    client.send(JSON.stringify({
        type: 'auth',
        data: {
            version: loaderVersion,
            licenseKey: bs_loader.license,
            discord: bs_loader.discord
        }
    }));
};
