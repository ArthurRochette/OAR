from django.db import models
from oar.models import *
from django.contrib.auth.models import User


# Create your models here.

class Comment(models.Model):
    """
    Store a single commentary, related to `oar.Indication` and a `auth.User`
    """
    indication = models.ForeignKey(Indication, on_delete=models.CASCADE, related_name='comments')
    reply_to = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, related_name='reply')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    body = models.TextField()
    created_on = models.DateTimeField(auto_now_add=True)
    
    
    # check before create
    def save(self, *args, **kwargs):
        if Comment.objects.filter(indication=self.indication, user=self.user, body=self.body, created_on=self.created_on).exists():
            return ValueError("Comment already exists")
        else:
            super(Comment, self).save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        comments_linked = Comment.objects.filter(reply_to=self)
        for comment in comments_linked:
            comment.delete()
        super(Comment, self).delete(*args, **kwargs)

    class Meta:
        ordering = ['created_on']

    def __str__(self):
        return 'Comment {} by {}'.format(self.body, self.user.username)
