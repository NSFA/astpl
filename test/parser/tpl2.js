Easy.widget.define({
  name: 'testq',
  tpl: '<div class        ="m-page <%= clazz %>"> \
            <div><%= asas%></div> \
            <!-- haha --> \
            <a  href="javascript:;" class="pageprv <%if current==1 %>z-dis<%/if%>">Prev</a> \
            <%if total - 5 > show * 2%> \
              <a href="javascript:;" class="<%if current==1 %>z-crt<%/if%>">1</a> \
              <%if begin > 2%><i>...</i><%/if%> \
              <%list arra as i%> \
                <a href="javascript:;" class="<%if current==i %>z-crt<%/if%>" ><%= i %></a> \
              <%/list%> \
              <%if (end < total-1)%> \
               <i>...</i> \
              <%/if%> \
              <a href="javascript:;" class="<%if current==total %>z-crt<%/if%>"><%= total %></a> \
            <%else%> \
              <%list arra as i%> \
                <a href="javascript:;"  class="<%if current==i %>z-crt<%/if%>"><%= i %><%= asas%></a> \
              <%/list%> \
            <%/if%> \
            <a href="javascript:;"  class="pagenxt <%if current == total%>z-dis<%/if%>">Next</a> \
          </div>'
});

window.t = new Easy.widget.test({
  parent: '#gg',
  data: {
    clazz: 'aa',
    current: 2,
    total: 10,
    show: 7,
    begin: 3,
    arra: [1,2,3,4,5],
    end: 8,
    asas: 'hahahaha'
  },
  onupdate: function(data) {
    console.log(data);
  }
});