const config = require("./config");
const IRC = require("matrix-org-irc");
const fs = require("fs");

const bot = new IRC.Client(config.addr, config.nick, config);
const sess = new Map();
const inbox = new Map();
const collab = new Map();

bot.on("message", (nick, to, text) => {
  let name = text.split(" ").slice(1).join(" ");
  let userdir = __dirname + "/.codes/" + nick;
  if (nick === config.nick) return;
  if (to === config.nick) to = nick;
  if (sess.has(nick)) {
    // User is in editing session.
    let usess = sess.get(nick);
    if (usess.croom) {
      userdir = __dirname + "/.codes/" + usess.croom;
      usess = sess.get(usess.croom);
    }
    switch (text.split(" ")[0]) {
      case ".h":
        bot.say(
          to,
          [
            ".v  [from] [to]  : View Code",
            ".nl [lineNumber] : Create new line",
            ".dl [lineNumber] : Delete Line",
            ".i  [username]   : Invite user to collaborate",
            ".rc [username]   : Remove collaborator",
            ".w               : Write file",
            ".q               : Quit Session",
            'How to edit: Type your message in this format: "[lineNumber] [code]"',
            'Say, You want to edit the 12th line. Type "12 Lorem Ipsum" and done.',
          ].join("\n")
        );
        break;
      case ".v":
        {
          let linenum = Number(text.split(" ").slice(1)[0]);
          let eln = Number(text.split(" ").slice(1)[1]);
          if (linenum) {
            linenum--;
            if (!usess.code[linenum])
              return bot.say(
                to,
                "There's no line " + (linenum + 1) + " in your code."
              );

            let ln = linenum;
            usess.code.slice(linenum).forEach((c) => {
              if (eln && ln >= eln) return;
              ln++;
              bot.say(to, ln + "|" + c);
            });
          } else {
            let ln = 0;
            usess.code.forEach((c) => {
              ln++;

              bot.say(to, ln + "|" + c);
            });
          }
        }

        bot.say(to, "End of code. Type \".nl\" to add new line.");
        break;
      case ".nl":
        {
          let linenum = Number(text.split(" ").slice(1)[0]);
          if (linenum) {
            linenum--;
            if (!usess.code[linenum])
              return bot.say(
                to,
                "There's no line " + (linenum + 1) + " in your code."
              );
            usess.code[linenum] = [" ", usess.code[linenum]];
            return (usess.code = usess.code.flat(Infinity));
          }
          usess.code.push(" ");
        }
        break;
      case ".dl":
        {
          let linenum = Number(text.split(" ").slice(1)[0]);
          if (linenum) {
            delete usess.code[linenum - 1];
            return (usess.code = usess.code.flat(Infinity));
          }

          return usess.code.pop();
        }
        break;
      case ".w":
        try {
          fs.writeFileSync(
            userdir + "/" + usess.filename,
            usess.code
              .map((i) => {
                if (i === " ") i = "";
                return i;
              })
              .join("\n"),
            "ascii"
          );
          bot.say(
            to,
            `${usess.filename}: write ${usess.code.length} lines of code`
          );
        } catch (error) {
          bot.say(to, error.toString());
          console.error(error);
        }
        break;
      case ".q":
        if (usess.collaborators)
          usess.collaborators.forEach((i) => {
            sess.delete(i);
            usess.collaborators.delete(i);
          });
        sess.delete(nick);
        bot.say(to, "quit: " + nick);
        if (usess.croom)
          bot.notice(usess.croom, `Collab: ${nick} left`);
        break;
      case ".i":
        {
          name = name.split(" ")[0];
          if (!name) {
            bot.say(
              to,
              `Collaborators: ${
                Array.from(usess.collaborators).join(", ") || "No collaborators"
              }`
            );
            if (sess.get(nick).croom) return;
            bot.say(
              to,
              `To invite user to edit together with your code, Type .i [username]`
            );
            bot.say(to, `To remove collab user, Type .rc [username]`);
          } else {
            if (sess.get(nick).croom) return;
            usess.collaborators.add(name);
            bot.notice(
              name,
              `Collab: ${nick} invites you to edit at ${
                to === nick ? "PM" : to
              }.`
            );
            bot.notice(name, `To start editing, Type .ec ${nick}`);
            bot.say(to, `Collab: Invited ${name}`);
          }
        }
        break;
      case ".rc":
        {
          if (sess.get(nick).croom) return;
          name = name.split(" ")[0];
          if (!name) return bot.say(to, "remove_collab: Usage: .rc [username]");
          usess.collaborators.delete(name);
          if (sess.has(name) && sess.get(name).croom === nick) {
            sess.delete(name);
            bot.notice(name, `Collab: ${nick} removes you from collaboration`);
          }
          bot.say(to, "remove_collab: " + name);
        }
        break;
      default:
        let m = text.split(" ");
        let n = parseInt(m[0], 10);
        if (n > 0) {
          usess.code[n - 1] = m.slice(1).join(" ");
          usess.code = usess.code.flat(Infinity);
        }

        break;
    }
  } else {
    // User is not in editing session. Handle commands
    switch (text.split(" ")[0]) {
      case ".h":
        bot.say(
          to,
          [
            "Hello. I am file editor bot.",
            "To start editing, type .e [filename]",
            "You can use .ls, .rn, .rm, .i, and .s to manage your files.",
          ].join("\n")
        );
        break;
      case ".ls":
        try {
          bot.say(to, fs.readdirSync(userdir).join(", "));
        } catch (error) {
          if (error.code === "ENOENT") return;
          bot.say(to, error.toString());
          console.error(error);
        }
        break;
      case ".rn":
        {
          let splitted = name.split("|");
          let from = splitted[0];
          let toName = splitted[1];
          if (!from || !toName)
            return bot.say(to, "rename: Usage: .rn [from]|[to]");
          if (
            from.includes("..") ||
            from.includes("/") ||
            toName.includes("..") ||
            toName.includes("/")
          )
            return bot.say(to, "rename: Invalid file name.");

          try {
            fs.renameSync(userdir + "/" + from, userdir + "/" + toName);
            bot.say(to, "rename: " + from + " as " + toName);
          } catch (error) {
            bot.say(to, error.toString());
            console.error(error);
          }
        }
        break;
      case ".rm":
        if (!name) return bot.say(to, "remove: Usage: .rm [filename]");
        if (name.includes("..") || name.includes("/"))
          return bot.say(to, "rm: Invalid file name");

        try {
          fs.rmSync(userdir + "/" + name);
        } catch {}
        bot.say(to, "rm: " + name);
        break;
      case ".s":
        {
          let splitted = name.split(" ");
          let uname = splitted[0];
          let filename = splitted.slice(1).join(" ");
          if (filename.includes("..") || filename.includes("/"))
            return bot.say(to, "share: Invalid file name");
          if (!uname || !fs.existsSync(userdir + "/" + filename))
            return bot.say(to, "share: Usage: .s [to] [filename]");
          if (!inbox.has(uname)) inbox.set(uname, []);

          if (
            inbox
              .get(uname)
              .filter((i) => i.fromUser === nick && i.filename === filename)
              .length > 0
          )
            return bot.say(to, "share: That file is already in queue.");

          let n = inbox.get(uname).push({
            fromUser: nick,
            filename: filename,
          });

          bot.notice(uname, `${nick} is sending you a file: ${filename}`);
          bot.notice(uname, `To accept this, Type .i ${n}`);
          bot.notice(uname, `To reject this request, Type .ri ${n}`);
          bot.say(to, `share: Request sent to ${uname}.`);
          bot.say(
            to,
            `share: To cancel this, Type ".cs ${uname} ${filename}"`
          );
        }
        break;
      case ".cs":
        {
          let splitted = name.split(" ");
          let uname = splitted[0];
          let filename = splitted.slice(1).join(" ");
          if (filename.includes("..") || filename.includes("/"))
            return bot.say(to, "cancel_send: Invalid file name");
          if (!inbox.has(uname) || !filename)
            return bot.say(to, "cancel_send: Usage: .cs [username] [filename]");

          let uib = inbox
            .get(uname)
            .filter((i) => i.fromUser === nick && i.filename === filename);

          if (!uib.length)
            return bot.say(
              to,
              `cancel_send: You didn't send ${filename} to ${uname}`
            );
          inbox.set(
            uname,
            inbox.get(uname).filter((i) => {
              i.fromUser !== nick && i.filename !== filename;
            })
          );

          bot.say(to, "cancel_send: Succesfully cancelled");
          bot.notice(
            uname,
            `cancel_send: ${nick} cancelled to send ${filename}.`
          );
        }
        break;
      case ".i":
        {
          name = name.split(" ")[0];
          if (!inbox.has(nick) || !inbox.get(nick).length)
            return bot.say(to, "inbox: empty");
          if (!name) {
            if (nick !== to)
              bot.say(to, `${nick}: Inbox list has been sent to PM.`);
            bot.say(
              nick,
              `Inbox: You have ${inbox.get(nick).length} pending requests`
            );

            inbox
              .get(nick)
              .forEach((i, index) =>
                bot.say(nick, `${index + 1}| From ${i.fromUser}: ${i.filename}`)
              );

            bot.say(
              nick,
              "End of Inbox. To accept one of those requests, Type .i [num]"
            );
            bot.say(nick, "To Reject request, Do .ri [num]");
          } else if (parseInt(name, 10) > 0) {
            let i = inbox.get(nick)[parseInt(name, 10) - 1];
            if (!i) return bot.say(to, "Inbox: Empty");

            if (fs.existsSync(userdir + "/" + i.fromUser + "_" + i.filename))
              return bot.say(
                to,
                `Inbox: Existing file (${
                  i.fromUser + "_" + i.filename
                }), Skipped`
              );

            if (
              !fs.existsSync(
                __dirname + "/.codes/" + i.fromUser + "/" + i.filename
              )
            ) {
              bot.say(
                to,
                `share: ${i.fromUser} deleted ${i.filename}. Operation cancelled.`
              );
              bot.notice(
                i.fromUser,
                `share: You deleted ${i.filename} before ${nick} accept your request. Operation cancelled.`
              );

              delete inbox.get(nick)[parseInt(name, 10) - 1];
              return inbox.set(nick, inbox.get(nick).flat());
            }
            fs.cpSync(
              __dirname + "/.codes/" + i.fromUser + "/" + i.filename,
              userdir + "/" + i.fromUser + "_" + i.filename
            );

            delete inbox.get(nick)[parseInt(name, 10) - 1];
            inbox.set(nick, inbox.get(nick).flat());
            bot.say(to, "share: Received " + i.filename);
            bot.notice(
              i.fromUser,
              `share: ${nick} accepted your request: ${i.filename}`
            );

            bot.notice(to, "share: Task finished.");
          }
        }
        break;
      case ".ri":
        {
          name = name.split(" ")[0];
          if (!inbox.has(nick) || !inbox.get(nick).length)
            return bot.say(to, "inbox: empty");
          if (!name || !(parseInt(name, 10) > 0))
            return bot.say(to, "remove_inbox: Usage: .ri [num]");
          delete inbox.get(nick)[parseInt(name, 10) - 1];
          inbox.set(nick, inbox.get(nick).flat());
          bot.say(to, "remove_inbox: " + parseInt(name, 10));
        }
        break;
      case ".e":
        if (!name) name = "main.txt";
        if (name.includes("..") || name.includes("/"))
          return bot.say(to, "edit: Invalid file name");
        sess.set(nick, {
          filename: name,
          code: [],
          collaborators: new Set(),
        });

        if (!fs.existsSync(userdir))
          fs.mkdirSync(userdir, {
            recursive: true,
          });

        if (fs.existsSync(userdir + "/" + name)) {
          sess.get(nick).code = fs
            .readFileSync(userdir + "/" + name, "ascii")
            .split("\n")
            .map((i) => {
              if (!i.length) i = " ";
              return i;
            });
        }

        bot.say(to, "Filename: " + name);
        bot.say(
          to,
          "Reading " +
            sess.get(nick).code.length +
            " lines of code. Type \".h\" for basic help."
        );
        break;
      case ".ec":
        {
          name = name.split(" ")[0];
          if (!name) bot.say(to, "Collab: Usage: .ec [username]");
          if (
            !sess.has(name) ||
            sess.get(name).croom ||
            !sess.get(name).collaborators.has(nick)
          )
            return bot.say(to, "Collab: Unavailable or not invited");
          sess.set(nick, {
            croom: name,
          });
          bot.notice(name, `Collab: ${nick} has been joined.`);
          bot.say(
            to,
            "Reading " +
              sess.get(name).code.length +
              " lines of code. To view code, Type .v"
          );
        }
        break;
    }
  }
});

bot.on("registered", () =>
  console.log("login: Succesfully logged as", config.nick)
);
bot.on("motd", console.log);
bot.on("error", console.error);

if (config.acceptInvites)
  bot.on("invite", (c) => {
    bot.join(c);
  });

process.on("SIGINT", () => {
  console.log("\nWaiting for server to disconnect....");
  bot.disconnect("Editor Quit");
});
