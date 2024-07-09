from django.http import HttpResponse

# Create your views here.
def HomeView(request):
    return HttpResponse("El rabazo de Angie chavez aguanto tres golpes, y aprobo calidad")
