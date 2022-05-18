<template>
  <overlay @reloadLeagues="reloadLeagues" />
  <price-check ref="priceCheck"/>
  
</template>

<script>
//import HelloWorld from './components/HelloWorld.vue'
import PriceCheck from './views/PriceCheck/PriceCheck.vue'
import Overlay from './views/Overlay/Overlay.vue'
export default {
  name: 'App',
  components:{
    PriceCheck, Overlay
  },
  data(){
    return{

    }
  },
  methods:{
    reloadLeagues(){
      this.$refs.priceCheck.loadLeagues()
    }
  },
  computed:{

  },

}
</script>
