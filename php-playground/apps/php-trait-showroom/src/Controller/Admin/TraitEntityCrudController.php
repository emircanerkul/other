<?php

namespace App\Controller\Admin;

use App\Entity\TraitEntity;
use EasyCorp\Bundle\EasyAdminBundle\Controller\AbstractCrudController;

class TraitEntityCrudController extends AbstractCrudController
{
    public static function getEntityFqcn(): string
    {
        return TraitEntity::class;
    }

    /*
    public function configureFields(string $pageName): iterable
    {
        return [
            IdField::new('id'),
            TextField::new('title'),
            TextEditorField::new('description'),
        ];
    }
    */
}
