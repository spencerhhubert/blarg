function getPlatform(url) {
    domain = new URL(url).hostname;
    switch (domain) {
        case "twitter.com":
            return new Twitter();
    }
}

class Platform {
    update() {
        this.html = document.body
        this.posts = this.getPosts()
        this.insertButtons(this.posts)
    }
    getPosts() {
        raw = this.getRawPosts()
        raw = raw.slice(this.posts.length) //chop off posts we've already seen
        posts = []
        for (let i = 0; i < raw.length; i++) {
            node = raw[i+this.posts.length]
            posts.push(new Post(node, this.getPostContent(node)))
        }
        return this.posts.concat(posts)
    }
    insertButtons(this.posts) {
        for (let i = 0; i < posts.length; i++) {
            this.insertButton(posts[i])
        }
    }
}

//incoming regret
//but this inherited class should be the only thing that needs editing across platforms
class Twitter extends Platform {
    getRawPosts() {
        return this.html.querySelectorAll('.tweet')
    }
    getPostContent(post) {
        return post.node.querySelector('.tweet-text').innerText
    }
    insertButton(post) {
        const button = document.createElement("button")
        button.className = "annoying-btn"
        button.innerText = "Annoying"
        button.addEventListener("click", function () {
            post.mute()
        })
        post.node.querySelector('.stream-item-header').appendChild(button)
    }
} 

class Post {
    constructor(node, content) {
        this.node = node
        this.content = content
        this.keep = true
    }
    mute() {
        this.node.style.display = "none"
        this.keep = false
    }
}

function predictions(posts, token) {
    fetch(`https://spencerhubert.info/blarg/api/predict?token=${token}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
      },
        body: JSON.stringify(posts.map(post => post.content))
    })
    .then(response => {
        preds = JSON.parse(response) //list of 0s and 1s
        for (let i = 0; i < posts.length; i++) {
            if (preds[i] == false) {
                posts[i].mute()
            }
        }
    })
    .catch(error => {
        console.log(error)
        console.log("Couldn't get is annoying or not post predictions from server")
        return null
    })
}

//update and continue updating while there are updates to the dom
platform = getPlatform(window.location.href)
platform.update()
const observer = new MutationObserver(platform.update)
observer.observe(document.body, { childList: true, subtree: true });
