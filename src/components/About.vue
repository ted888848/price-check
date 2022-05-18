<template>
<p id="demo"> {{flag}} </p>
<button type="button" @click="btnClick()">PRESS</button>
</template>
<script>
export default{
  name: 'About',
  data(){
    return{
      flag: 1,
    }
  },
  methods: {
    btnClick() {
      this.flag = 1 - this.flag
    }
  }
}
</script>