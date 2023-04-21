# blarg
a chrome extension to fine-tune your own personal neural net to block the type of content you don't want to see online

## the problem
there are many things online that we don't want to see. let's consider these posts the "annoying posts." we want to block them from all our feeds: twitter, youtube, reddit. etc. however, there's a few problems:

- what's annoying to one person is totally different from that of another
- some annoying things social media algorithms are incentivized to show you
- what exactly we mean by "annoying" is not easily articulated. its description exists in a highly abstract space, above that of english.

## the solution
we want to train a neural net on a large set of posts we find "not annoying" (keep) and "annoying" (block) and have it find the high level similarities between the annoying posts, so after a relatively small amount of personal labeling, the annoying posts go away.

we'll do this with a chrome extension that embeds an option to mark posts on websites as annoying or not and then batch fine-tunes a language model on that data.
