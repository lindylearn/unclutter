<!-- adapted from https://github.com/kirillDanshin/halogenium/blob/master/src/DotLoader.jsx -->
<script lang="ts">
    let className = "";
    export { className as class };
</script>

<div class={"wrapper " + className}>
    <div class="ball" />
    <div class="ball ball-2" />
</div>

<style>
    .wrapper {
        animation: rotateAnimation 2s 0s infinite linear;
        animation-fill-mode: forwards;
        width: 18px;
        height: 18px;
        margin-right: 7px;
        position: relative;
        border: 0px solid transparent;
    }
    @keyframes rotateAnimation {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }

    .ball {
        background-color: black;
        width: 7px;
        height: 7px;
        border-radius: 100%;
        animation: bounceAnimation 2s 0s infinite ease-in-out;
        animation-fill-mode: forwards;
        position: absolute;
        top: auto;
        bottom: 0;
        border: 0px solid transparent;
    }
    .ball-2 {
        animation-delay: -1s;
        top: 0;
        bottom: auto;
        right: 0;
    }
    @keyframes bounceAnimation {
        0%,
        100% {
            transform: scale(1);
        }
        50% {
            transform: scale(0.4);
        }
    }
</style>
