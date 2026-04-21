from rest_framework.response import Response
from rest_framework.views import APIView

from .rag_engine import ensure_knowledge_base, generate_answer, get_neo4j_graph_stats, retrieve_documents


class ChatAPIView(APIView):
    def post(self, request):
        query = request.data.get("query", "").strip()
        if not query:
            return Response({"response": "Vui lòng nhập câu hỏi."}, status=400)

        status = ensure_knowledge_base()
        docs = retrieve_documents(query=query, limit=3)
        result = generate_answer(query, docs)

        return Response({
            "response": result["answer"],
            "sources": result["sources"],
            "retrieved_documents": [{"title": d["title"], "score": d["score"]} for d in docs],
            "index_backend": status["backend"],
        })


class ChatKnowledgeBaseStatusAPIView(APIView):
    def get(self, request):
        return Response(ensure_knowledge_base())


class ChatKnowledgeGraphStatusAPIView(APIView):
    def get(self, request):
        try:
            return Response({"backend": "neo4j", "graph_stats": get_neo4j_graph_stats()})
        except Exception:
            status = ensure_knowledge_base()
            return Response({"backend": status["backend"], "graph_stats": status.get("graph_stats")})
