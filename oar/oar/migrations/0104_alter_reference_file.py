# Generated by Django 4.1.2 on 2024-08-22 11:48

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("oar", "0103_alter_reference_file_hash"),
    ]

    operations = [
        migrations.AlterField(
            model_name="reference",
            name="file",
            field=models.FileField(
                blank=True, max_length=255, null=True, upload_to="references"
            ),
        ),
    ]
